import React, { useState } from 'react';
import Collapse from '@mui/material/Collapse';
import {
  Plus,
  Minus,
  PlayCircle,
  ExternalLink,
  Info
} from 'lucide-react';
import {
  SharedTabs,
  type SharedTabItem,
  SharedTable,
  type TableColumn,
  SharedTooltip,
  SharedButton,
  QueueRolePillGroup,
  UserTablePill
} from '../../../components/shared';
import { useUserSession } from '../../../context/UserSessionContext';
import {
  getEngagementWorkflowState,
  getIssueBreakdown,
  getCategoryFilteredIssues,
  isITIssue,
  getRoleDetails,
  resolveEngagementQueueAvatars
} from '../utils/reportingWorkflowEngine';
import { WorkflowModal } from './WorkflowModal';
import { IssueLogsDialog } from './IssueLogsDialog';

export interface AuditQueueCardRowProps {
  job: any;
  userRole: string;
  isBusinessRole: boolean;
  auditTab: 'my-actions' | 'all-associated';
  isExpanded: boolean;
  onToggleExpand: () => void;
  expandedInnerTab: string;
  onChangeInnerTab: (tabId: string) => void;
  sendToDropdownIssueId: string | null;
  setSendToDropdownIssueId: (id: string | null) => void;
  onWorkOnReport: (job: any, type: 'audit' | 'executive') => void;
  onOpenCreateForJob: (job: any) => void;
  onSelectReportingJob: (jobId: string) => void;
  onSendToRole: (jobId: string, issueId: string, targetStageObj: any, e: React.MouseEvent) => void;
}

export const AuditQueueCardRow: React.FC<AuditQueueCardRowProps> = ({
  job,
  userRole,
  isBusinessRole: _isBusinessRole,
  auditTab,
  isExpanded,
  onToggleExpand,
  expandedInnerTab,
  onChangeInnerTab,
  sendToDropdownIssueId: _sendToDropdownIssueId,
  setSendToDropdownIssueId: _setSendToDropdownIssueId,
  onWorkOnReport,
  onOpenCreateForJob,
  onSelectReportingJob,
  onSendToRole: _onSendToRole
}) => {
  const { currentUser } = useUserSession();
  const [workflowModalIssue, setWorkflowModalIssue] = useState<any | null>(null);
  const [trackChangesIssue, setTrackChangesIssue] = useState<any | null>(null);
  const [hasInteracted, setHasInteracted] = useState(false);

  const userRoleDetails = getRoleDetails(userRole);
  const userDomain = userRoleDetails.domain;
  const userBaseRole = userRoleDetails.baseRole;

  // Action button permissions:
  // - Director, VP, and Business Contact can edit all issues
  // - For IT person: IT issues are editable, FinOps issues are view-only
  // - For FinOps person: FinOps issues are editable, IT issues are view-only
  const canEditIssue = (iss: any): boolean => {
    if (userBaseRole === 'director' || userBaseRole === 'vp' || userDomain === 'All') {
      return true;
    }
    const isIT = isITIssue(iss);
    if (userDomain === 'IT') {
      return isIT;
    }
    if (userDomain === 'FinOps') {
      return !isIT;
    }
    return true;
  };

  const getIssueOwner = (iss: any, currentJob: any): string => {
    if (iss.owner && typeof iss.owner === 'string') return iss.owner;
    const s = (iss.status || '').toLowerCase();
    const lvl = (iss.currentLevel || '').toLowerCase();

    if (s === 'completed' || lvl.includes('signed off') || lvl.includes('completed')) {
      return 'QA Archive';
    }
    if (s.includes('vp') || lvl.includes('vp')) {
      return 'Robert Chen';
    }
    if (s.includes('director') || lvl.includes('director')) {
      return 'Brian Cox';
    }
    if (s.includes('business') || lvl.includes('business')) {
      return iss.accountableContact || iss.primaryContact || currentJob?.leadOwner || 'Vinay Narasimha';
    }
    if (s.includes('manager') || lvl.includes('manager')) {
      return iss.lastEditedBy || 'Amanda Palmer';
    }
    if (s.includes('tc') || lvl.includes('tc') || lvl.includes('coordinator')) {
      return 'Kevin Zhang';
    }
    return iss.createdBy || 'Marcus Vance';
  };

  const wf = getEngagementWorkflowState(job);
  const { primaryUser, remainingAssignees } = resolveEngagementQueueAvatars(job, currentUser, auditTab, wf);
  const isNotStarted = wf.status === 'Not Started';
  const bd = getIssueBreakdown(job, userRole, auditTab === 'my-actions');

  // Status / Strength Indication Dot Renderer (Harmonized with AccordionGroup: 13px font-medium text-slate-700)
  const renderEngagementStatusPill = (statusText: string) => {
    const s = statusText || 'Not Started';
    let dotColor = '#94A3B8';
    let isDash = false;

    if (s === 'Completed') {
      dotColor = '#087D0D';
    } else if (s === 'Audit Report Inprogress' || s.includes('Audit')) {
      dotColor = '#000099';
    } else if (s === 'Executive Report Inprogress' || s.includes('Executive')) {
      dotColor = '#E67300';
    } else if (s === 'Not Started') {
      isDash = true;
    }

    if (isDash) {
      return (
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
          <span style={{ fontSize: 'var(--type-table-row-size, 12.5px)', fontWeight: 400, color: '#94A3B8' }}>—</span>
          <span style={{ fontSize: 'var(--type-table-row-size, 12.5px)', fontWeight: 400, color: '#64748B' }}>Not Started</span>
        </div>
      );
    }

    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', whiteSpace: 'nowrap' }}>
        <span
          style={{
            width: '9px',
            height: '9px',
            borderRadius: '50%',
            backgroundColor: dotColor,
            flexShrink: 0
          }}
        />
        <span style={{ fontSize: 'var(--type-table-row-size, 12.5px)', fontWeight: 400, color: '#334155' }}>
          {s}
        </span>
      </div>
    );
  };

  // Issues Breakdown Cell (Used for Action Issues on My Actions or Total Issues on All Associated)
  const renderIssuesBreakdownCell = () => (
    <div style={{ textAlign: 'center' }}>
      {isNotStarted ? (
        <span style={{ fontSize: 'var(--type-table-row-size, 12.5px)', fontWeight: 400, color: '#94A3B8' }}>-</span>
      ) : (
        <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', gap: '2px' }}>
          <span style={{ fontSize: 'var(--type-table-row-size, 12.5px)', fontWeight: 400, color: '#334155' }}>
            {bd.total} {bd.total === 1 ? 'Issue' : 'Issues'}
          </span>
          {/* On My Action Audits: no split of IT and FinOps per user specification; show only on All Associated */}
          {auditTab === 'all-associated' && (
            <div style={{ display: 'flex', gap: '3px' }}>
              {bd.totalIT > 0 && (
                <span className="type-badge" style={{ padding: '1px 4px', borderRadius: '3px', fontSize: 'var(--type-badge-size, 9.5px)', fontWeight: 700, backgroundColor: '#f1f4ff', color: '#000099', border: '1px solid #c5dbfc' }}>
                  {bd.totalIT} IT
                </span>
              )}
              {bd.totalFin > 0 && (
                <span className="type-badge" style={{ padding: '1px 4px', borderRadius: '3px', fontSize: 'var(--type-badge-size, 9.5px)', fontWeight: 700, backgroundColor: '#fffbeb', color: '#92400e', border: '1px solid #fef3c7' }}>
                  {bd.totalFin} FinOps
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );

  const currentTabKey = expandedInnerTab || 'all';
  const displayedIssues = getCategoryFilteredIssues(
    job,
    auditTab === 'my-actions' ? 'all' : currentTabKey,
    userRole,
    auditTab === 'my-actions'
  );

  const categoryTabs: SharedTabItem<string>[] = [
    { id: 'all', label: 'ALL', count: bd.total },
    { id: 'it', label: 'IT', count: bd.totalIT },
    { id: 'finops', label: 'FINOPS', count: bd.totalFin },
    { id: 'completed', label: 'COMPLETED', count: bd.completed }
  ];

  // Table columns definition for SharedTable: Issue Title, Function (IT/FinOps), Criticality, Stage, Owner, Action Buttons
  const issueColumns: TableColumn<any>[] = [
    {
      id: 'title',
      label: 'ISSUE TITLE',
      align: 'left',
      width: '280px',
      render: (iss: any) => (
        <span
          className="type-table-row-title"
          style={{
            fontSize: 'var(--type-table-row-title-size, 13px)',
            fontWeight: 400,
            color: 'var(--type-studio-title-color, #334155)',
            lineHeight: 'var(--type-table-row-title-leading, 1.4)' as any,
            display: 'block'
          }}
        >
          {iss.title || iss.header || iss.id}
        </span>
      )
    },
    {
      id: 'function',
      label: 'FUNCTION',
      align: 'center',
      width: '85px',
      render: (iss: any) => {
        const isIT = isITIssue(iss);
        return (
          <span
            className="type-table-cell"
            style={{
              fontSize: 'var(--type-table-row-size, 12.5px)',
              fontWeight: 400,
              color: '#334155'
            }}
          >
            {isIT ? 'IT' : 'FinOps'}
          </span>
        );
      }
    },
    {
      id: 'criticality',
      label: 'CRITICALITY',
      align: 'center',
      width: '105px',
      render: (iss: any) => {
        const crit = (iss.criticality || 'Minor').trim();
        const critLower = crit.toLowerCase();
        let color = '#087D0D'; // Minor green
        if (critLower.includes('crit')) {
          color = '#eb1700'; // Critical red
        } else if (critLower.includes('maj') || critLower.includes('med') || critLower.includes('amb')) {
          color = '#ff8200'; // Major amber
        }

        return (
          <span
            className="type-table-cell"
            style={{
              fontSize: 'var(--type-table-row-size, 12.5px)',
              fontWeight: 400,
              color: color
            }}
          >
            {crit}
          </span>
        );
      }
    },
    {
      id: 'stage',
      label: 'STAGE',
      align: 'left',
      width: '160px',
      render: (iss: any) => {
        const s = (iss.status || '').toLowerCase();
        const lvl = (iss.currentLevel || '').toLowerCase();

        let label = 'Pending Staff';
        if (s === 'completed' || lvl.includes('signed off') || lvl.includes('completed')) {
          label = 'Completed';
        } else if (s.includes('vp') || lvl.includes('vp')) {
          label = 'Pending VP';
        } else if (s.includes('director') || lvl.includes('director')) {
          label = 'Pending Director';
        } else if (s.includes('business') || lvl.includes('business')) {
          label = 'Pending with Business';
        } else if (s.includes('manager') || lvl.includes('manager')) {
          label = 'Pending Manager';
        } else if (s.includes('tc') || lvl.includes('tc') || lvl.includes('coordinator')) {
          label = 'Pending TC';
        } else if (s.includes('draft') || lvl.includes('draft') || lvl.includes('auditor') || s.includes('staff')) {
          label = 'Pending Staff';
        } else if (iss.status) {
          label = iss.status;
        }

        return (
          <span
            className="type-table-cell"
            style={{
              fontSize: 'var(--type-table-row-size, 12.5px)',
              fontWeight: 400,
              color: '#334155',
              whiteSpace: 'nowrap'
            }}
          >
            {label}
          </span>
        );
      }
    },
    {
      id: 'owner',
      label: 'OWNER',
      align: 'left',
      width: '140px',
      render: (iss: any) => {
        const ownerName = getIssueOwner(iss, job);
        return (
          <span
            className="type-table-cell"
            style={{
              fontSize: 'var(--type-table-row-size, 12.5px)',
              fontWeight: 400,
              color: '#334155',
              whiteSpace: 'nowrap'
            }}
          >
            {ownerName}
          </span>
        );
      }
    },
    {
      id: 'actions',
      label: 'ACTIONS',
      align: 'right',
      width: '230px',
      render: (iss: any) => {
        const editable = canEditIssue(iss);

        return (
          <div
            className="inner-row-action-buttons"
            style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}
          >
            {!editable ? (
              /* View Only for different function */
              <SharedTooltip title="View Issue (Read-Only)" placement="top">
                <SharedButton
                  variant="secondary"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    onWorkOnReport(job, 'audit');
                  }}
                  style={{
                    minHeight: 'var(--control-min-height-compact, 1.625rem)',
                    padding: '2px 8px',
                    fontSize: 'var(--type-caption-size, 11px)',
                    fontWeight: 700,
                  }}
                  aria-label="View Issue (Read-Only)"
                >
                  View
                </SharedButton>
              </SharedTooltip>
            ) : (
              /* Same Function: Order = Edit, Workflow, Track Changes */
              <>
                {/* 1. Edit */}
                <SharedTooltip title="Edit Issue in Studio" placement="top">
                  <SharedButton
                    variant="outline"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      onWorkOnReport(job, 'audit');
                    }}
                    style={{
                      minHeight: 'var(--control-min-height-compact, 1.625rem)',
                      padding: '2px 8px',
                      fontSize: 'var(--type-caption-size, 11px)',
                      fontWeight: 700,
                    }}
                    aria-label="Edit Issue in Studio"
                  >
                    Edit
                  </SharedButton>
                </SharedTooltip>

                {/* 2. Workflow */}
                <SharedTooltip title="View Workflow Pipeline" placement="top">
                  <SharedButton
                    variant="secondary"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setWorkflowModalIssue(iss);
                    }}
                    style={{
                      minHeight: 'var(--control-min-height-compact, 1.625rem)',
                      padding: '2px 8px',
                      fontSize: 'var(--type-caption-size, 11px)',
                      fontWeight: 700,
                    }}
                    aria-label="View Workflow Pipeline"
                  >
                    Workflow
                  </SharedButton>
                </SharedTooltip>

                {/* 3. Track Changes */}
                <SharedTooltip title="Track Changes & Event History" placement="top">
                  <SharedButton
                    variant="secondary"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      setTrackChangesIssue(iss);
                    }}
                    style={{
                      minHeight: 'var(--control-min-height-compact, 1.625rem)',
                      padding: '2px 8px',
                      fontSize: 'var(--type-caption-size, 11px)',
                      fontWeight: 700,
                    }}
                    aria-label="Track Changes & Event History"
                  >
                    Track Changes
                  </SharedButton>
                </SharedTooltip>
              </>
            )}
          </div>
        );
      }
    }
  ];

  // Action Buttons Group (Shared between Collapsed hover actions and Expanded permanent header actions)
  const renderActionButtons = (isExpandedMode: boolean) => (
    <div
      className={isExpandedMode ? 'audit-queue-row-actions-expanded' : 'audit-queue-row-actions'}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        justifyContent: 'flex-end',
        flexWrap: 'nowrap',
        whiteSpace: 'nowrap',
        flexShrink: 0,
        ...(isExpandedMode ? { opacity: 1, visibility: 'visible', pointerEvents: 'auto', transform: 'none' } : {})
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <SharedTooltip title="Create New Issue" placement="top">
        <SharedButton
          variant="outline"
          size="small"
          startIcon={<Plus size={12} strokeWidth={2.5} style={{ flexShrink: 0 }} />}
          onClick={(e) => {
            e.stopPropagation();
            onOpenCreateForJob(job);
          }}
          className="audit-queue-action-btn"
          style={{
            padding: '4px 10px',
            fontSize: 'var(--type-caption-size, 11.5px)',
            fontWeight: 700,
            color: '#000099',
            backgroundColor: '#EFF6FF',
            borderColor: '#BFDBFE',
            borderRadius: '5px',
            minHeight: 'var(--control-min-height-compact, 1.625rem)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            flexShrink: 0,
            whiteSpace: 'nowrap'
          }}
          aria-label="Create New Issue"
        >
          Issue
        </SharedButton>
      </SharedTooltip>

      {!isNotStarted && (
        <SharedTooltip title="Open Audit Report" placement="top">
          <SharedButton
            variant="outline"
            size="small"
            startIcon={<PlayCircle size={13} style={{ flexShrink: 0 }} />}
            onClick={(e) => {
              e.stopPropagation();
              onWorkOnReport(job, 'audit');
            }}
            className="audit-queue-action-btn"
            style={{
              padding: '4px 11px',
              fontSize: 'var(--type-caption-size, 11.5px)',
              fontWeight: 700,
              color: '#000099',
              backgroundColor: '#EFF6FF',
              borderColor: '#BFDBFE',
              borderRadius: '5px',
              minHeight: 'var(--control-min-height-compact, 1.625rem)',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '5px',
              flexShrink: 0,
              whiteSpace: 'nowrap'
            }}
            aria-label="Open Audit Report"
          >
            <span className="audit-queue-btn-label-full">Audit Report</span>
            <span className="audit-queue-btn-label-compact">Audit</span>
          </SharedButton>
        </SharedTooltip>
      )}

      <SharedTooltip title="Open Executive Summary" placement="top">
        <SharedButton
          variant="outline"
          size="small"
          startIcon={<ExternalLink size={12} style={{ flexShrink: 0 }} />}
          onClick={(e) => {
            e.stopPropagation();
            onWorkOnReport(job, 'executive');
          }}
          className="audit-queue-action-btn"
          style={{
            padding: '4px 10px',
            fontSize: 'var(--type-caption-size, 11.5px)',
            fontWeight: 700,
            color: '#000099',
            backgroundColor: '#EFF6FF',
            borderColor: '#BFDBFE',
            borderRadius: '5px',
            minHeight: 'var(--control-min-height-compact, 1.625rem)',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            flexShrink: 0,
            whiteSpace: 'nowrap'
          }}
          aria-label="Open Executive Summary"
        >
          <span className="audit-queue-btn-label-full">Executive Summary</span>
          <span className="audit-queue-btn-label-compact">Executive</span>
        </SharedButton>
      </SharedTooltip>

      <SharedTooltip title="View Details Drawer" placement="top">
        <SharedButton
          variant="secondary"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            onSelectReportingJob(job.id);
          }}
          className="audit-queue-action-btn"
          style={{
            padding: '4px 8px',
            backgroundColor: '#f8fafc',
            borderColor: '#cbd5e1',
            borderRadius: '5px',
            color: '#64748B',
            minHeight: 'var(--control-min-height-compact, 1.625rem)',
            minWidth: 'var(--control-min-height-compact, 1.625rem)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            whiteSpace: 'nowrap'
          }}
          aria-label="View Details Drawer"
        >
          <Info size={13} style={{ flexShrink: 0 }} />
        </SharedButton>
      </SharedTooltip>

    </div>
  );

  return (
    <div className={`audit-queue-card-group ${isExpanded ? 'is-expanded' : ''}`}>
      {/* 
        Unified Header / Primary Row Card:
        Keeps its own closed border at the exact same position, whether collapsed or expanded.
      */}
      <div
        className={`audit-queue-card audit-queue-card-summary ${auditTab === 'my-actions' ? 'my-actions-layout' : 'all-associated-layout'} ${isExpanded ? 'is-expanded expanded' : ''}`}
        onClick={() => {
          setHasInteracted(true);
          if (document.activeElement instanceof HTMLElement) {
            document.activeElement.blur();
          }
          onToggleExpand();
        }}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setHasInteracted(true);
            onToggleExpand();
          }
        }}
        style={{
          marginBottom: isExpanded ? '10px' : '12px'
        }}
      >
        {/* 1. Red Plus / Minus Toggle Button (Column 1: 44px) - Clean button with subtle pulse animation */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <button
            type="button"
            className="expand-btn"
            onClick={(e) => {
              e.stopPropagation();
              setHasInteracted(true);
              if (document.activeElement instanceof HTMLElement) {
                document.activeElement.blur();
              }
              onToggleExpand();
            }}
            aria-label={isExpanded ? 'Collapse findings workbench' : 'Expand findings workbench'}
          >
            {hasInteracted && (
              <span
                key={`pulse-${isExpanded}`}
                className="expand-btn-pulse-ring"
                aria-hidden="true"
              />
            )}
            <span
              key={hasInteracted ? `icon-${isExpanded}` : 'icon-static'}
              className={hasInteracted ? 'expand-btn-icon' : undefined}
              style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
            >
              {isExpanded ? (
                <Minus size={20} color="#eb1700" strokeWidth={2.8} />
              ) : (
                <Plus size={20} color="#eb1700" strokeWidth={2.8} />
              )}
            </span>
          </button>
        </div>

        {/* 2. Engagement Title (Matching AccordionGroup with Parent Header: 15px font-medium text-slate-700, truncated with ellipsis + SharedTooltip on hover) */}
        <div style={{ paddingRight: '12px', minWidth: 0, overflow: 'hidden' }}>
          <SharedTooltip
            title={job.fileName || job.engagement}
            placement="top"
            wrapperStyle={{ display: 'block', minWidth: 0, width: '100%', overflow: 'hidden' }}
          >
            <div
              className="type-studio-title"
              style={{
                fontWeight: 400,
                color: 'var(--type-studio-title-color, #334155)',
                fontSize: 'var(--type-studio-title-size, 15px)',
                lineHeight: 'var(--type-studio-title-leading, 1.3)' as any,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                cursor: 'pointer',
                minWidth: 0,
              }}
            >
              {job.fileName || job.engagement}
            </div>
          </SharedTooltip>
        </div>

        {/* 3. Strength Indication (Matching AccordionGroup with Parent Header: 13px font-medium text-slate-700) */}
        <div style={{ paddingRight: '8px' }}>
          {renderEngagementStatusPill(wf.status)}
        </div>

        {/* 
          Remaining Columns:
          - When Collapsed (!isExpanded): Render regular columns (Issues, Queue, Owner, In-Progress, Completed, Hover Actions).
          - When Expanded (isExpanded): Hide action issues, queue, owner, and show action buttons (+ Issue, Audit Report, Executive Report, Info, Full Screen) ALWAYS visible.
        */}
        {!isExpanded ? (
          <>
            {/* When My Action Audits: Action Issues is placed right next to Status */}
            {auditTab === 'my-actions' && renderIssuesBreakdownCell()}

            {/* Current Queue (Componentized QueueRolePillGroup with short abbreviations) */}
            <div style={{ paddingRight: '8px' }}>
              <QueueRolePillGroup roles={wf.queueList} />
            </div>

            {/* Current Owner (Componentized UserTablePill with 1st user + +N hover) */}
            <div style={{ paddingRight: '8px' }}>
              <UserTablePill
                owners={wf.owners}
                primaryUser={primaryUser}
                remainingAssignees={remainingAssignees}
                queue={wf.queue}
              />
            </div>

            {/* When All Associated Audits: Only In-Progress Issues Breakdown in primary row (Single Row, Center Aligned) */}
            {auditTab === 'all-associated' && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {isNotStarted ? (
                  <span style={{ fontSize: 'var(--type-caption-size, 11px)', color: '#94A3B8' }}>-</span>
                ) : (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', whiteSpace: 'nowrap' }}>
                    <span style={{ fontSize: 'var(--type-table-row-size, 12px)', fontWeight: 400, color: '#212121' }}>
                      {bd.inProgress}
                    </span>
                    {(bd.inProgressIT > 0 || bd.inProgressFin > 0) && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                        {bd.inProgressIT > 0 && (
                          <span className="type-badge" style={{ padding: '1px 4px', borderRadius: '3px', fontSize: 'var(--type-badge-size, 9.5px)', fontWeight: 700, backgroundColor: '#f1f4ff', color: '#000099', border: '1px solid #c5dbfc' }}>
                            {bd.inProgressIT} IT
                          </span>
                        )}
                        {bd.inProgressFin > 0 && (
                          <span className="type-badge" style={{ padding: '1px 4px', borderRadius: '3px', fontSize: 'var(--type-badge-size, 9.5px)', fontWeight: 700, backgroundColor: '#fffbeb', color: '#92400e', border: '1px solid #fef3c7' }}>
                            {bd.inProgressFin} Fin
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
            {/* Actions: Visible on Hover in Collapsed Mode */}
            {renderActionButtons(false)}
          </>
        ) : (
          /* Expanded Mode: Spans from grid line 4 to the end (-1) with Actions ALWAYS visible */
          <div
            style={{
              gridColumn: '4 / -1',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: '8px'
            }}
          >
            {renderActionButtons(true)}
          </div>
        )}
      </div>

      {/* 
        Expanded Content Area (Animated with Accordion Slide):
        Rendered underneath the closed primary row, Category Tabs & Issues Sub-Table smoothly expand/collapse.
      */}
      <Collapse in={isExpanded} timeout={300} unmountOnExit={false}>
        <div
          style={{
            paddingLeft: '58px',
            paddingRight: '0',
            marginBottom: '16px'
          }}
        >
          {/* Category Tabs on Left & Metrics Container on Right in One Row (Only on All Associated Audits) */}
          {auditTab === 'all-associated' && (
            <div style={{ marginBottom: '12px' }}>
              <SharedTabs
                items={categoryTabs}
                value={currentTabKey}
                onChange={onChangeInnerTab}
                variant="workbench"
                size="small"
                tabGap="28px"
                ariaLabel="Finding category filter tabs"
                rightAction={
                  <div
                    className="audit-queue-expanded-metrics-bar"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '16px',
                      padding: '3px 10px',
                      backgroundColor: '#ffffff',
                      border: '1px solid #e2e8f0',
                      borderRadius: '5px',
                      boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
                      marginBottom: '3px'
                    }}
                  >
                    {/* 1. Total Issues Metric */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: '#64748B',
                          letterSpacing: '0.04em'
                        }}
                      >
                        Total Issues:
                      </span>
                      <span style={{ fontSize: 'var(--type-table-row-size, 12px)', fontWeight: 400, color: '#334155' }}>
                        {bd.total}
                      </span>
                      {(bd.totalIT > 0 || bd.totalFin > 0) && (
                        <div style={{ display: 'inline-flex', gap: '3px' }}>
                          {bd.totalIT > 0 && (
                            <span className="type-badge" style={{ padding: '1px 4px', borderRadius: '3px', fontSize: 'var(--type-badge-size, 9.5px)', fontWeight: 700, backgroundColor: '#f1f4ff', color: '#000099', border: '1px solid #c5dbfc' }}>
                              {bd.totalIT} IT
                            </span>
                          )}
                          {bd.totalFin > 0 && (
                            <span className="type-badge" style={{ padding: '1px 4px', borderRadius: '3px', fontSize: 'var(--type-badge-size, 9.5px)', fontWeight: 700, backgroundColor: '#fffbeb', color: '#92400e', border: '1px solid #fef3c7' }}>
                              {bd.totalFin} Fin
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Divider */}
                    <div style={{ width: '1px', height: '14px', backgroundColor: '#e2e8f0' }} />

                    {/* 2. In-Progress Metric */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: '#64748B',
                          letterSpacing: '0.04em'
                        }}
                      >
                        In-Progress:
                      </span>
                      <span style={{ fontSize: 'var(--type-table-row-size, 12px)', fontWeight: 400, color: '#334155' }}>
                        {bd.inProgress}
                      </span>
                      {(bd.inProgressIT > 0 || bd.inProgressFin > 0) && (
                        <div style={{ display: 'inline-flex', gap: '3px' }}>
                          {bd.inProgressIT > 0 && (
                            <span className="type-badge" style={{ padding: '1px 4px', borderRadius: '3px', fontSize: 'var(--type-badge-size, 9.5px)', fontWeight: 700, backgroundColor: '#f1f4ff', color: '#000099', border: '1px solid #c5dbfc' }}>
                              {bd.inProgressIT} IT
                            </span>
                          )}
                          {bd.inProgressFin > 0 && (
                            <span className="type-badge" style={{ padding: '1px 4px', borderRadius: '3px', fontSize: 'var(--type-badge-size, 9.5px)', fontWeight: 700, backgroundColor: '#fffbeb', color: '#92400e', border: '1px solid #fef3c7' }}>
                              {bd.inProgressFin} Fin
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Divider */}
                    <div style={{ width: '1px', height: '14px', backgroundColor: '#e2e8f0' }} />

                    {/* 3. Completed Metric */}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <span
                        style={{
                          fontSize: '10.5px',
                          fontWeight: 700,
                          textTransform: 'uppercase',
                          color: '#64748B',
                          letterSpacing: '0.04em'
                        }}
                      >
                        Completed:
                      </span>
                      <span style={{ fontSize: 'var(--type-table-row-size, 12px)', fontWeight: 400, color: '#334155' }}>
                        {bd.completed}
                      </span>
                      {(bd.completedIT > 0 || bd.completedFin > 0) && (
                        <div style={{ display: 'inline-flex', gap: '3px' }}>
                          {bd.completedIT > 0 && (
                            <span className="type-badge" style={{ padding: '1px 4px', borderRadius: '3px', fontSize: 'var(--type-badge-size, 9.5px)', fontWeight: 700, backgroundColor: '#ecfdf5', color: '#087d0d', border: '1px solid #a7f3d0' }}>
                              {bd.completedIT} IT
                            </span>
                          )}
                          {bd.completedFin > 0 && (
                            <span className="type-badge" style={{ padding: '1px 4px', borderRadius: '3px', fontSize: 'var(--type-badge-size, 9.5px)', fontWeight: 700, backgroundColor: '#ecfdf5', color: '#087d0d', border: '1px solid #a7f3d0' }}>
                              {bd.completedFin} Fin
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                }
              />
            </div>
          )}

          {/* Issues Sub-Table rendered with SharedTable (Harmonized with Dashboards - Embedded Table) */}
          <div className="overflow-x-auto" style={{ padding: '2px 2px 6px 2px' }}>
            <SharedTable
              columns={issueColumns}
              rows={displayedIssues}
              rowKey={(row: any) => row.id}
              showPagination={false}
              shadowBorder={true}
              headerBgColor="#f8fafc"
              rowBgColor="#fafbfc"
              hoverBgColor="#f5f7fa"
              emptyMessage="No issues match this category filter."
            />
          </div>
        </div>
      </Collapse>

      {/* Issue Workflow Pipeline Modal */}
      {workflowModalIssue && (
        <WorkflowModal
          isOpen={!!workflowModalIssue}
          onClose={() => setWorkflowModalIssue(null)}
          job={job}
          title={`Workflow Pipeline — ${workflowModalIssue.title || workflowModalIssue.header || job.fileName}`}
          type="audit"
        />
      )}

      {/* Issue Track Changes Log Modal */}
      {trackChangesIssue && (
        <IssueLogsDialog
          open={!!trackChangesIssue}
          onClose={() => setTrackChangesIssue(null)}
          issueId={trackChangesIssue.id || 'ISSUE-001'}
          issueTitle={trackChangesIssue.title || trackChangesIssue.header || 'Finding'}
          logs={[]}
        />
      )}
    </div>
  );
};

export default AuditQueueCardRow;
