import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  History,
  Clock,
  ArrowRight,
  Sparkles,
  Filter,
  AlertCircle,
} from 'lucide-react';
import type { AuditTrailLog, Issue } from '../../../types/dataverse.types';

export type TrackChangesScope = 'issue' | 'report';

interface BackupStyleLogEntry {
  id: string;
  issueId?: string | null;
  engagementId?: string;
  timestamp: string;
  displayTime: string;
  actor: {
    userId: string;
    name: string;
    role: string;
    domain?: string;
  };
  category: string;
  badgeType:
    | 'create'
    | 'workflow'
    | 'ai'
    | 'callback'
    | 'reroute'
    | 'function'
    | 'exclude'
    | 'director'
    | 'signoff'
    | 'response'
    | 'matrix'
    | 'scope'
    | 'comment'
    | 'issue'
    | 'update';
  action: string;
  fieldChanged?: string | null;
  oldValue?: string | null;
  newValue?: string | null;
  details?: {
    reason?: string;
    notes?: string;
    versionComparison?: {
      adoptedVersion: string;
      adoptedFields?: string[];
      retainedOriginalFields?: string[];
    };
    diffSummary?: string;
    gateRule?: string;
    totalIssuesCompiled?: number;
  };
}

interface IssueLogsDialogProps {
  open: boolean;
  onClose: () => void;
  issueId?: string;
  issueTitle?: string;
  issue?: Issue | null;
  engagementId?: string;
  engagementTitle?: string;
  initialScope?: TrackChangesScope;
  logs?: AuditTrailLog[];
}

export const IssueLogsDialog: React.FC<IssueLogsDialogProps> = ({
  open,
  onClose,
  issueId,
  issueTitle,
  issue,
  engagementId,
  engagementTitle,
  initialScope = 'issue',
}) => {
  const [activeFilter, setActiveFilter] = useState<string>('ALL');
  const [activeScope, setActiveScope] = useState<TrackChangesScope>(initialScope);

  useEffect(() => {
    if (open) {
      setActiveScope(initialScope);
      setActiveFilter('ALL');
    }
  }, [open, initialScope]);

  const resolvedIssueId = useMemo(() => {
    if (issue?.reportRef) return `ISSUE-${issue.reportRef}`;
    if (issueId && !issueId.includes('-')) return issueId;
    if (issueId && issueId.length > 16) return 'ISSUE-801';
    return issueId || 'ISSUE-801';
  }, [issue?.reportRef, issueId]);

  const resolvedIssueTitle =
    issue?.title ||
    issueTitle ||
    'Privileged Account Monitoring & SOX 404 Access Revocation';

  const resolvedEngName =
    engagementTitle || 'IM - Grants Process Review';

  // Efficient, realistic Mock Data for Issue Audit Trail (mirrors Backup_JNJ_IAR/src/data/issueLogs.json)
  const mockIssueLogs: BackupStyleLogEntry[] = useMemo(
    () => [
      {
        id: 'LOG-ISS-801-10',
        issueId: resolvedIssueId,
        engagementId: engagementId || 'REP-2026-008',
        timestamp: '2026-08-03T16:15:00Z',
        displayTime: 'Today at 04:15 PM',
        actor: {
          userId: 'USR-013',
          name: 'Thomas Wright',
          role: 'Primary Business Owner',
          domain: 'Cross-Domain',
        },
        category: 'MANAGEMENT_RESPONSE',
        badgeType: 'response',
        action: 'Business Management Response Submitted',
        fieldChanged: 'Management Response & Remediation Date',
        oldValue: 'Pending Business',
        newValue: 'Pending Manager (Response Received — Target: Dec 31, 2026)',
        details: {
          notes:
            'Management concurs with the finding. Automated PAM session revocation and quarterly role recertification will be deployed by Q4 2026.',
        },
      },
      {
        id: 'LOG-ISS-801-09',
        issueId: resolvedIssueId,
        engagementId: engagementId || 'REP-2026-008',
        timestamp: '2026-08-02T14:30:00Z',
        displayTime: 'Yesterday at 02:30 PM',
        actor: {
          userId: 'USR-006',
          name: 'Amanda Palmer',
          role: 'IT Audit Manager',
          domain: 'IT',
        },
        category: 'WORKFLOW_TRANSITION',
        badgeType: 'workflow',
        action: 'Manager Review Completed — Waiting for Remaining Audit Findings',
        fieldChanged: 'Workflow Queue & Status',
        oldValue: 'Pending Manager',
        newValue: 'Manager Completed (Waiting for Other Issues)',
      },
      {
        id: 'LOG-ISS-801-08',
        issueId: resolvedIssueId,
        engagementId: engagementId || 'REP-2026-008',
        timestamp: '2026-08-01T11:20:00Z',
        displayTime: '08/01/2026 at 11:20 AM',
        actor: {
          userId: 'USR-006',
          name: 'Amanda Palmer',
          role: 'IT Audit Manager',
          domain: 'IT',
        },
        category: 'CALL_BACK',
        badgeType: 'callback',
        action: 'Issue Called Back to Manager Review Queue',
        fieldChanged: 'Workflow Status',
        oldValue: 'Ready for Director Submission',
        newValue: 'Pending Manager',
        details: {
          reason:
            'Recalled finding to attach updated SOX 404 sample testing workpaper and verify Primary Business Owner assignment.',
        },
      },
      {
        id: 'LOG-ISS-801-07',
        issueId: resolvedIssueId,
        engagementId: engagementId || 'REP-2026-008',
        timestamp: '2026-07-31T16:00:00Z',
        displayTime: '07/31/2026 at 04:00 PM',
        actor: {
          userId: 'USR-003',
          name: 'Gowri P',
          role: 'IT Audit Team Coordinator',
          domain: 'IT',
        },
        category: 'SEND_TO',
        badgeType: 'reroute',
        action: 'Re-routed Issue via Send To Peer Handover',
        fieldChanged: 'Current Owner & Queue',
        oldValue: 'Gowri P (Pending TC)',
        newValue: 'Amanda Palmer (Pending Manager)',
        details: {
          notes:
            'Forwarded to Audit Manager after verifying root cause taxonomy and sample exception counts.',
        },
      },
      {
        id: 'LOG-ISS-801-06',
        issueId: resolvedIssueId,
        engagementId: engagementId || 'REP-2026-008',
        timestamp: '2026-07-31T11:45:00Z',
        displayTime: '07/31/2026 at 11:45 AM',
        actor: {
          userId: 'USR-006',
          name: 'Amanda Palmer',
          role: 'IT Audit Manager',
          domain: 'IT',
        },
        category: 'EXCLUSION_TOGGLE',
        badgeType: 'create',
        action: 'Issue Restored & Included Back into Audit Report',
        fieldChanged: 'Report Compilation Inclusion',
        oldValue: 'Excluded',
        newValue: 'Pending Manager',
        details: {
          notes:
            'Reinstated into active report after confirming compensating control did not cover privileged database accounts.',
        },
      },
      {
        id: 'LOG-ISS-801-05',
        issueId: resolvedIssueId,
        engagementId: engagementId || 'REP-2026-008',
        timestamp: '2026-07-30T17:10:00Z',
        displayTime: '07/30/2026 at 05:10 PM',
        actor: {
          userId: 'USR-006',
          name: 'Amanda Palmer',
          role: 'IT Audit Manager',
          domain: 'IT',
        },
        category: 'EXCLUSION_TOGGLE',
        badgeType: 'exclude',
        action: 'Issue Excluded from Final Audit Report',
        fieldChanged: 'Report Compilation Inclusion',
        oldValue: 'Pending Manager',
        newValue: 'Excluded',
        details: {
          reason:
            'Temporarily excluded pending confirmation of duplicate observation under TP-104.',
        },
      },
      {
        id: 'LOG-ISS-801-04',
        issueId: resolvedIssueId,
        engagementId: engagementId || 'REP-2026-008',
        timestamp: '2026-07-30T14:40:00Z',
        displayTime: '07/30/2026 at 02:40 PM',
        actor: {
          userId: 'USR-003',
          name: 'Gowri P',
          role: 'IT Audit Team Coordinator',
          domain: 'IT',
        },
        category: 'AI_REGENERATION',
        badgeType: 'ai',
        action: 'AI Prompt Regeneration & Version Card Comparison',
        fieldChanged: 'Root Cause & Recommendations',
        oldValue: 'Version 1 AI Synthesis',
        newValue: 'Version 2 AI Synthesis (Adopted)',
        details: {
          versionComparison: {
            adoptedVersion: 'v2 (Refined)',
            adoptedFields: ['rootCause', 'recommendations'],
            retainedOriginalFields: ['impact'],
          },
          diffSummary:
            'Adopted v2 Root Cause and Recommendations with quantified 14-account SLA revocation metrics; kept original Impact statement.',
        },
      },
      {
        id: 'LOG-ISS-801-03',
        issueId: resolvedIssueId,
        engagementId: engagementId || 'REP-2026-008',
        timestamp: '2026-07-30T10:10:00Z',
        displayTime: '07/30/2026 at 10:10 AM',
        actor: {
          userId: 'USR-003',
          name: 'Gowri P',
          role: 'IT Audit Team Coordinator',
          domain: 'IT',
        },
        category: 'FIELD_EDIT',
        badgeType: 'update',
        action: 'Updated Criticality Level & Accountable Function',
        fieldChanged: 'Criticality',
        oldValue: 'Minor',
        newValue: 'Critical',
      },
      {
        id: 'LOG-ISS-801-02B',
        issueId: resolvedIssueId,
        engagementId: engagementId || 'REP-2026-008',
        timestamp: '2026-07-29T15:45:00Z',
        displayTime: '07/29/2026 at 03:45 PM',
        actor: {
          userId: 'USR-002',
          name: 'Tamilselvan',
          role: 'Staff IT Auditor',
          domain: 'IT',
        },
        category: 'NOT_MY_FUNCTION',
        badgeType: 'function',
        action: "Marked as 'Not My Function Issue' (Function Reassigned)",
        fieldChanged: 'Function Track',
        oldValue: 'FinOps',
        newValue: 'IT',
        details: {
          notes:
            'Reassigned functional track from FinOps to IT because privileged Active Directory group provisioning falls under IT Security governance.',
        },
      },
      {
        id: 'LOG-ISS-801-02',
        issueId: resolvedIssueId,
        engagementId: engagementId || 'REP-2026-008',
        timestamp: '2026-07-29T11:20:00Z',
        displayTime: '07/29/2026 at 11:20 AM',
        actor: {
          userId: 'SYS-AI',
          name: 'IAR AI Assistant',
          role: 'GxP & SOX Compliance Engine',
          domain: 'Cross-Domain',
        },
        category: 'AI_GENERATION',
        badgeType: 'ai',
        action: 'AI Magic Wand Generated Issue Finding & Citations',
        fieldChanged: 'Title, Description, Root Cause, Impact, Recommendations',
        oldValue: 'Raw Fieldwork Notes',
        newValue: 'AI Refined Finding & IAPP S-15 Compliance Citations',
      },
      {
        id: 'LOG-ISS-801-01',
        issueId: resolvedIssueId,
        engagementId: engagementId || 'REP-2026-008',
        timestamp: '2026-07-28T09:15:00Z',
        displayTime: '07/28/2026 at 09:15 AM',
        actor: {
          userId: 'USR-002',
          name: 'Tamilselvan',
          role: 'Staff IT Auditor',
          domain: 'IT',
        },
        category: 'CREATION',
        badgeType: 'create',
        action: 'Issue Created from Test Procedure TP-101',
        fieldChanged: 'Record Initialization',
        oldValue: null,
        newValue: `${resolvedIssueId} Draft Initialized (Pending Staff)`,
      },
    ],
    [resolvedIssueId, engagementId]
  );

  // Efficient, realistic Mock Data for Engagement Audit Report History (mirrors Backup_JNJ_IAR/src/data/auditReportLogs.json)
  const mockReportLogs: BackupStyleLogEntry[] = useMemo(
    () => [
      {
        id: 'LOG-AUD-REP-06',
        engagementId: engagementId || 'REP-2026-008',
        issueId: null,
        timestamp: '2026-08-05T11:30:00Z',
        displayTime: 'Today at 11:30 AM',
        actor: {
          userId: 'USR-010',
          name: 'Robert Chen',
          role: 'Vice President, Internal Audit',
          domain: 'Cross-Domain',
        },
        category: 'VP_SIGNOFF',
        badgeType: 'signoff',
        action: 'Complete and Sign-Off Executed — Audit Report Finalized',
        fieldChanged: 'Engagement Report Status',
        oldValue: 'Audit Report Inprogress (Pending VP)',
        newValue: 'Executive Report Inprogress',
      },
      {
        id: 'LOG-AUD-REP-05',
        engagementId: engagementId || 'REP-2026-008',
        issueId: null,
        timestamp: '2026-08-04T15:05:00Z',
        displayTime: 'Yesterday at 03:05 PM',
        actor: {
          userId: 'USR-009',
          name: 'Marcus Vance',
          role: 'Audit Director',
          domain: 'IT',
        },
        category: 'DIRECTOR_REVIEW_SUBMIT',
        badgeType: 'director',
        action: 'Director Review Approved — Audit Report Submitted to Vice President',
        fieldChanged: 'Engagement Queue & Stage',
        oldValue: 'Pending Director',
        newValue: 'Pending VP (Escalated: 1 Critical Finding)',
        details: {
          notes:
            'All management responses and target dates validated. Escalated to VP for final sign-off due to Critical finding on privileged access.',
        },
      },
      {
        id: 'LOG-AUD-REP-04',
        engagementId: engagementId || 'REP-2026-008',
        issueId: null,
        timestamp: '2026-08-03T10:00:00Z',
        displayTime: '08/03/2026 at 10:00 AM',
        actor: {
          userId: 'USR-009',
          name: 'Marcus Vance',
          role: 'Audit Director',
          domain: 'IT',
        },
        category: 'WORKFLOW_TRANSITION',
        badgeType: 'workflow',
        action: 'Director Routed Findings to Business Owners (Send to Business)',
        fieldChanged: 'Engagement Review Stage',
        oldValue: 'Pending Director',
        newValue: 'Pending Business',
        details: {
          notes:
            'Provisioned findings to SharePoint Business Owner Response List for formal Management Response and CAP submission.',
        },
      },
      {
        id: 'LOG-AUD-REP-03',
        engagementId: engagementId || 'REP-2026-008',
        issueId: 'ISSUE-803',
        timestamp: '2026-08-02T16:05:00Z',
        displayTime: '08/02/2026 at 04:05 PM',
        actor: {
          userId: 'USR-006',
          name: 'Amanda Palmer',
          role: 'IT Audit Manager',
          domain: 'IT',
        },
        category: 'BATCH_ISSUES_COMPILED',
        badgeType: 'workflow',
        action: 'All Issues Completed by Manager — Audit Report Compiled for Director Review',
        fieldChanged: 'Engagement Queue & Stage',
        oldValue: 'Manager Review (Waiting for Other Issues)',
        newValue: 'Ready for Director Submission ➔ Pending Director',
        details: {
          gateRule: 'BATCH_SYNCHRONIZATION_GATE',
          totalIssuesCompiled: 4,
        },
      },
      {
        id: 'LOG-AUD-REP-02',
        engagementId: engagementId || 'REP-2026-008',
        issueId: 'ISSUE-801',
        timestamp: '2026-08-01T15:35:00Z',
        displayTime: '08/01/2026 at 03:35 PM',
        actor: {
          userId: 'USR-006',
          name: 'Amanda Palmer',
          role: 'IT Audit Manager',
          domain: 'IT',
        },
        category: 'INTERIM_GATE_UPDATE',
        badgeType: 'workflow',
        action: 'Interim Manager Review Completed (3 of 4 Findings Cleared)',
        fieldChanged: 'Engagement Audit Progress',
        oldValue: 'Pending Manager',
        newValue: 'Manager Completed (Waiting on remaining 1 finding)',
      },
      {
        id: 'LOG-AUD-REP-01',
        engagementId: engagementId || 'REP-2026-008',
        issueId: null,
        timestamp: '2026-07-28T09:15:00Z',
        displayTime: '07/28/2026 at 09:15 AM',
        actor: {
          userId: 'USR-002',
          name: 'Tamilselvan',
          role: 'Staff IT Auditor',
          domain: 'IT',
        },
        category: 'REPORT_INITIALIZATION',
        badgeType: 'create',
        action: 'Audit Report Initiated upon First Finding Creation',
        fieldChanged: 'Report Status',
        oldValue: 'Not Started',
        newValue: 'Audit Report Inprogress',
      },
    ],
    [engagementId]
  );

  const effectiveLogs = useMemo(() => {
    return activeScope === 'issue' ? mockIssueLogs : mockReportLogs;
  }, [activeScope, mockIssueLogs, mockReportLogs]);

  // Dynamic modal title and category matching Backup_JNJ_IAR/src/components/issues/IssueLogsModal.jsx
  const modalCategory =
    activeScope === 'issue'
      ? `Issue Audit Trail — ${resolvedIssueId}`
      : 'Engagement Audit History';

  const modalTitle =
    activeScope === 'issue'
      ? `Finding History — ${resolvedIssueTitle}`
      : `History Log — ${resolvedEngName}`;

  const modalDescription =
    activeScope === 'issue'
      ? 'Complete tamper-evident track changes, AI refinements, and workflow transitions for this issue'
      : 'Audit engagement lifecycle, batch clearance milestones, and report sign-offs';

  // Filter logs by active category tab
  const filteredLogs = useMemo(() => {
    if (activeFilter === 'ALL') return effectiveLogs;
    if (activeFilter === 'WORKFLOW') {
      return effectiveLogs.filter(
        (l) =>
          l.category === 'WORKFLOW_TRANSITION' ||
          l.category?.includes('BATCH') ||
          l.category?.includes('INTERIM') ||
          l.category?.includes('DIRECTOR') ||
          l.category?.includes('VP') ||
          l.category === 'MANAGEMENT_RESPONSE' ||
          l.badgeType === 'workflow' ||
          l.badgeType === 'director' ||
          l.badgeType === 'signoff' ||
          l.badgeType === 'response'
      );
    }
    if (activeFilter === 'FIELD_EDIT') {
      return effectiveLogs.filter(
        (l) =>
          l.category === 'FIELD_EDIT' ||
          l.category === 'CREATION' ||
          l.category === 'REPORT_INITIALIZATION' ||
          l.badgeType === 'update' ||
          l.badgeType === 'create' ||
          l.badgeType === 'matrix' ||
          l.badgeType === 'scope'
      );
    }
    if (activeFilter === 'AI') {
      return effectiveLogs.filter(
        (l) => l.category?.includes('AI') || l.badgeType === 'ai'
      );
    }
    if (activeFilter === 'GOVERNANCE') {
      return effectiveLogs.filter(
        (l) =>
          l.category === 'CALL_BACK' ||
          l.category === 'SEND_TO' ||
          l.category === 'NOT_MY_FUNCTION' ||
          l.category === 'EXCLUSION_TOGGLE' ||
          l.badgeType === 'callback' ||
          l.badgeType === 'reroute' ||
          l.badgeType === 'function' ||
          l.badgeType === 'exclude'
      );
    }
    return effectiveLogs;
  }, [effectiveLogs, activeFilter]);

  if (!open) return null;

  const renderBadge = (type: BackupStyleLogEntry['badgeType']) => {
    let bg = '#EFF6FF';
    let text = '#000099';
    let label = 'Updated';

    if (type === 'create') {
      bg = '#EFF6FF';
      text = '#000099';
      label = 'Created';
    } else if (type === 'workflow') {
      bg = '#F0FDF4';
      text = '#087D0D';
      label = 'Workflow';
    } else if (type === 'ai') {
      bg = '#EFF6FF';
      text = '#000099';
      label = 'AI Generated';
    } else if (type === 'callback') {
      bg = '#FFF1F0';
      text = '#eb1700';
      label = 'Called Back';
    } else if (type === 'reroute') {
      bg = '#FEF3C7';
      text = '#B45309';
      label = 'Re-routed';
    } else if (type === 'function') {
      bg = '#F0FDF4';
      text = '#087D0D';
      label = 'Not My Function';
    } else if (type === 'exclude') {
      bg = '#FFF1F0';
      text = '#eb1700';
      label = 'Excluded';
    } else if (type === 'director') {
      bg = '#EFF6FF';
      text = '#000099';
      label = 'Director Review';
    } else if (type === 'signoff') {
      bg = '#F0FDF4';
      text = '#087D0D';
      label = 'VP Sign-Off';
    } else if (type === 'response') {
      bg = '#F0F9FF';
      text = '#0284C7';
      label = 'Biz Response';
    } else if (type === 'matrix') {
      bg = '#FEF3C7';
      text = '#92400E';
      label = 'Matrix Adjusted';
    } else if (type === 'scope') {
      bg = '#EFF6FF';
      text = '#000099';
      label = 'Scope Modified';
    } else if (type === 'comment') {
      bg = '#EFF6FF';
      text = '#000099';
      label = 'Comment';
    } else if (type === 'issue') {
      bg = '#FFF1F0';
      text = '#eb1700';
      label = 'Issue Logged';
    }

    return (
      <span
        style={{
          fontSize: '11px',
          fontWeight: 700,
          padding: '3px 8px',
          borderRadius: '6px',
          backgroundColor: bg,
          color: text,
          display: 'inline-flex',
          alignItems: 'center',
          gap: '4px',
          fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
        }}
      >
        {type === 'ai' && <Sparkles style={{ width: '11px', height: '11px' }} />}
        {label}
      </span>
    );
  };

  const getActorInitials = (name = 'User') => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(33, 33, 33, 0.55)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        justifyContent: 'flex-end',
        zIndex: 1500,
        fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
      }}
      onClick={onClose}
    >
      {/* Right Overlay Drawer Panel (Layout & Design identical to Backup_JNJ_IAR/src/components/issues/IssueLogsModal.jsx) */}
      <aside
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '640px',
          maxWidth: '94vw',
          height: '100vh',
          backgroundColor: '#ffffff',
          boxShadow: '-10px 0 30px rgba(0,0,0,0.2)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          animation: 'slideInRight 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden',
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            padding: '18px 24px',
            borderBottom: '1px solid #000077',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            backgroundColor: '#000099',
            color: '#ffffff',
          }}
        >
          <div style={{ minWidth: 0, flex: 1, paddingRight: '12px' }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                marginBottom: '4px',
                flexWrap: 'wrap',
              }}
            >
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: '#FCA5A5',
                  letterSpacing: '0.9px',
                }}
              >
                {modalCategory}
              </span>
              <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.6)' }}>•</span>
              <span style={{ fontSize: '11px', color: '#E2E8F0', fontWeight: 600 }}>
                {effectiveLogs.length} logged event{effectiveLogs.length === 1 ? '' : 's'}
              </span>
            </div>
            <h2
              style={{
                fontSize: '17px',
                fontWeight: 800,
                margin: 0,
                color: '#FFFFFF',
                lineHeight: 1.3,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {modalTitle}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '7px',
              borderRadius: '6px',
              border: '1px solid rgba(255,255,255,0.25)',
              background: 'rgba(255,255,255,0.1)',
              color: '#ffffff',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.15s ease',
              flexShrink: 0,
            }}
            title="Close Drawer"
          >
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Filter Navigation Tabs */}
        <div
          style={{
            padding: '10px 24px',
            borderBottom: '1px solid #d8d8d8',
            backgroundColor: '#f4f4f4',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            overflowX: 'auto',
          }}
        >
          <Filter style={{ width: '13px', height: '13px', color: '#63666a', flexShrink: 0 }} />
          {[
            { id: 'ALL', label: 'All Events' },
            { id: 'WORKFLOW', label: 'Workflow' },
            { id: 'FIELD_EDIT', label: 'Field Edits' },
            { id: 'AI', label: 'AI Magic Wand' },
            { id: 'GOVERNANCE', label: 'Governance' },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveFilter(tab.id)}
              style={{
                padding: '5px 10px',
                fontSize: '11.5px',
                fontWeight: activeFilter === tab.id ? 700 : 600,
                borderRadius: '6px',
                border: activeFilter === tab.id ? '1px solid #d8d8d8' : '1px solid transparent',
                backgroundColor: activeFilter === tab.id ? '#FFFFFF' : 'transparent',
                color: activeFilter === tab.id ? '#000099' : '#63666a',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                boxShadow: activeFilter === tab.id ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                transition: 'all 0.15s ease',
                fontFamily: 'inherit',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Scrollable Timeline Body */}
        <div
          style={{
            padding: '24px',
            flex: 1,
            overflowY: 'auto',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
            backgroundColor: '#ffffff',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#63666a',
              fontSize: '12px',
              fontWeight: 600,
            }}
          >
            <History style={{ width: '15px', height: '15px', color: '#eb1700', flexShrink: 0 }} />
            <span>{modalDescription}</span>
          </div>

          {filteredLogs.length === 0 ? (
            <div
              style={{
                padding: '36px 20px',
                textAlign: 'center',
                backgroundColor: '#f4f4f4',
                border: '1px dashed #d8d8d8',
                borderRadius: '8px',
                color: '#63666a',
              }}
            >
              <AlertCircle
                style={{ width: '28px', height: '28px', color: '#94A3B8', margin: '0 auto 8px auto' }}
              />
              <p style={{ margin: 0, fontSize: '13px', fontWeight: 700, color: '#212121' }}>
                No events recorded for this category
              </p>
              <p style={{ margin: '4px 0 0 0', fontSize: '11.5px' }}>
                Events will appear as actions are performed.
              </p>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
                position: 'relative',
                paddingLeft: '8px',
              }}
            >
              {/* Vertical Timeline Line */}
              <div
                style={{
                  position: 'absolute',
                  top: '14px',
                  bottom: '14px',
                  left: '21px',
                  width: '2px',
                  backgroundColor: '#d8d8d8',
                  zIndex: 1,
                }}
              />

              {filteredLogs.map((log) => {
                const actorName = log.actor?.name || 'Team Member';
                const actorRole = log.actor?.role || 'Auditor';
                const actorInitials = getActorInitials(actorName);
                const isAI =
                  log.actor?.userId === 'SYS-AI' ||
                  log.category?.includes('AI') ||
                  log.badgeType === 'ai';

                return (
                  <div
                    key={log.id}
                    style={{
                      display: 'flex',
                      gap: '16px',
                      position: 'relative',
                      zIndex: 2,
                    }}
                  >
                    {/* Timeline Dot Icon */}
                    <div
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '50%',
                        backgroundColor: isAI ? '#000099' : '#ffffff',
                        border: isAI ? '2px solid #000099' : '2px solid #eb1700',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                        color: isAI ? '#ffffff' : '#eb1700',
                      }}
                    >
                      {isAI ? (
                        <Sparkles style={{ width: '13px', height: '13px' }} />
                      ) : (
                        <Clock style={{ width: '13px', height: '13px' }} />
                      )}
                    </div>

                    {/* Timeline Event Card */}
                    <div
                      style={{
                        flex: 1,
                        backgroundColor: '#F8FAFC',
                        border: '1px solid #d8d8d8',
                        borderRadius: '10px',
                        padding: '14px 16px',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '10px',
                        boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
                      }}
                    >
                      {/* Top Header Row */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          flexWrap: 'wrap',
                          gap: '6px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span
                            style={{
                              width: '24px',
                              height: '24px',
                              borderRadius: '50%',
                              backgroundColor: isAI ? '#000099' : '#212121',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10.5px',
                              fontWeight: 800,
                            }}
                          >
                            {isAI ? 'AI' : actorInitials}
                          </span>
                          <span style={{ fontSize: '13px', fontWeight: 800, color: '#212121' }}>
                            {actorName}
                          </span>
                          <span style={{ fontSize: '11px', color: '#63666a' }}>({actorRole})</span>
                        </div>

                        {renderBadge(log.badgeType)}
                      </div>

                      {/* Action Title */}
                      <p style={{ fontSize: '13px', fontWeight: 700, color: '#212121', margin: 0 }}>
                        {log.action}
                      </p>

                      {/* Field Changes Detail Box (if oldValue or newValue exists) */}
                      {(log.fieldChanged || log.oldValue || log.newValue) && (
                        <div
                          style={{
                            backgroundColor: '#ffffff',
                            border: '1px solid #d8d8d8',
                            borderRadius: '6px',
                            padding: '10px 12px',
                            fontSize: '11.5px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                          }}
                        >
                          {log.fieldChanged && (
                            <span style={{ fontWeight: 700, color: '#63666a' }}>
                              Field: <strong style={{ color: '#212121' }}>{log.fieldChanged}</strong>
                            </span>
                          )}

                          {log.oldValue && log.oldValue !== '-' && (
                            <div style={{ color: '#94A3B8', textDecoration: 'line-through' }}>
                              Previous: {log.oldValue}
                            </div>
                          )}

                          {log.newValue && (
                            <div
                              style={{
                                color: '#087D0D',
                                fontWeight: 700,
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: '4px',
                              }}
                            >
                              <ArrowRight
                                style={{
                                  width: '12px',
                                  height: '12px',
                                  marginTop: '2px',
                                  flexShrink: 0,
                                }}
                              />
                              <span>New: {log.newValue}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Call Back Reason Callout Box */}
                      {log.details?.reason && (
                        <div
                          style={{
                            backgroundColor: '#FFF1F0',
                            border: '1px solid #FCA5A5',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            fontSize: '11.5px',
                            color: '#991B1B',
                          }}
                        >
                          <strong>Mandatory Justification:</strong> {log.details.reason}
                        </div>
                      )}

                      {/* Governance Re-route / Delegation Reason */}
                      {log.details?.notes && (
                        <div
                          style={{
                            backgroundColor: '#EFF6FF',
                            border: '1px solid #BFDBFE',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            fontSize: '11.5px',
                            color: '#000099',
                          }}
                        >
                          <strong>Routing / Review Note:</strong> {log.details.notes}
                        </div>
                      )}

                      {/* AI Version Comparison Card Selection */}
                      {log.details?.versionComparison && (
                        <div
                          style={{
                            backgroundColor: '#EFF6FF',
                            border: '1px solid #BFDBFE',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            fontSize: '11.5px',
                            color: '#000099',
                          }}
                        >
                          <strong>Version Comparison:</strong> Adopted{' '}
                          {log.details.versionComparison.adoptedVersion}.
                          {log.details.diffSummary && (
                            <div style={{ marginTop: '2px', color: '#000099' }}>
                              {log.details.diffSummary}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Batch Clearance Gate Details */}
                      {log.details?.gateRule && (
                        <div
                          style={{
                            backgroundColor: '#F0FDF4',
                            border: '1px solid #A7F3D0',
                            borderRadius: '6px',
                            padding: '8px 12px',
                            fontSize: '11.5px',
                            color: '#087D0D',
                          }}
                        >
                          <strong>Batch Clearance Gate:</strong> All{' '}
                          {log.details.totalIssuesCompiled || 'issues'} cleared by Manager.
                          Engagement compiled and advanced.
                        </div>
                      )}

                      {/* Timestamp Footer */}
                      <span
                        style={{
                          fontSize: '11px',
                          color: '#63666a',
                          textAlign: 'right',
                          marginTop: '2px',
                        }}
                      >
                        {log.displayTime || log.timestamp}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </aside>
    </div>
  );
};
