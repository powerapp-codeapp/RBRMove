import React from 'react';
import {
  Lock,
  Eye,
  Ban,
  PanelLeftClose,
  RotateCcw,
  Send,
  CheckCircle2,
  AlertOctagon,
  History,
  GitBranch,
} from 'lucide-react';
import type { Issue } from '../../../../types/dataverse.types';
import { SharedListBoxFilter, type ListBoxFilterOption } from '../../../../components/shared';
import { SharedSelectButton } from '../../../../components/shared/buttons/SharedSelectButton';
import { WorkflowSubmitButton } from '../WorkflowSubmitButton';

export type SectionTab = 'all' | 'basic' | 'ai' | 'taxonomies' | 'biz';

export const SECTION_TAB_OPTIONS: ListBoxFilterOption<SectionTab>[] = [
  { value: 'all', label: 'All' },
  { value: 'basic', label: 'Primary Inputs' },
  { value: 'ai', label: 'AI Synthesis' },
  { value: 'taxonomies', label: 'Taxonomies & Classifications' },
  { value: 'biz', label: 'Business Response' },
];

export const getCriticalityColor = (crit?: string) => {
  const c = (crit || '').toLowerCase();
  if (c === 'critical') return '#DC2626';
  if (c === 'major') return '#EA580C';
  if (c === 'moderate') return '#D97706';
  if (c === 'minor') return '#16A34A';
  return '#334155';
};

interface WorkpaperHeaderToolbarProps {
  issue: Issue;
  isExcluded: boolean;
  isLocked: boolean;
  isLockedByCurrentUser: boolean;
  canEdit: boolean;
  editRestrictionReason?: string | null;
  isFurtherStage: boolean;
  userTier: number;
  userRole?: string;
  canCallBack: boolean;
  canSendTo: boolean;
  canExclude: boolean;
  isFieldDisabled: boolean;
  canShowIssueButtons: boolean;
  activeSectionTab: SectionTab;
  onTabChange: (tab: SectionTab) => void;
  onToggleCollapse?: (collapsed: boolean) => void;
  onToggleLock?: (issueId: string) => void;
  onIncludeIssue?: (issueId: string) => void;
  onAdvanceWorkflow?: (targetStatus: any, remarks?: string) => void;
  onOpenRemarksModal: (config: {
    isOpen: boolean;
    title: string;
    actionLabel: string;
    targetStatus: any;
  }) => void;
  onOpenCallback?: (issueId: string) => void;
  onOpenSendTo?: (issueId: string) => void;
  onMarkNotAnIssue?: (issueId: string) => void;
  onExcludeIssue?: (issueId: string) => void;
  onOpenLogs: () => void;
  onOpenWorkflow?: () => void;
}

export const WorkpaperHeaderToolbar: React.FC<WorkpaperHeaderToolbarProps> = ({
  issue,
  isExcluded,
  isLocked,
  isLockedByCurrentUser,
  canEdit,
  editRestrictionReason,
  isFurtherStage,
  userTier,
  userRole,
  canCallBack,
  canSendTo,
  canExclude,
  isFieldDisabled,
  canShowIssueButtons,
  activeSectionTab,
  onTabChange,
  onToggleCollapse,
  onToggleLock,
  onIncludeIssue,
  onAdvanceWorkflow,
  onOpenRemarksModal,
  onOpenCallback,
  onOpenSendTo,
  onMarkNotAnIssue,
  onExcludeIssue,
  onOpenLogs,
  onOpenWorkflow,
}) => {
  return (
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
      {/* Top Row: Status / Lock / Read-Only / Excluded Alert Container */}
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

      {/* Action Buttons Toolbar & Section Tab Filter */}
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
        {/* Left Side: Section Filter Tabs */}
        <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap' }}>
          <SharedListBoxFilter<SectionTab>
            options={SECTION_TAB_OPTIONS}
            value={activeSectionTab}
            onChange={onTabChange}
            size="small"
            ariaLabel="Filter sections by tab"
          />
        </div>

        {/* Right Side: Action Buttons */}
        {canShowIssueButtons && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap',
            }}
          >
            {canEdit && !isFurtherStage && (!isLocked || isLockedByCurrentUser) && onAdvanceWorkflow && (() => {
              const statusNorm = (issue.status || '').trim().toLowerCase();
              const isPendingStaff = !statusNorm || statusNorm.includes('staff') || statusNorm.includes('draft') || statusNorm.includes('auditor');
              const isPendingTC = (statusNorm.includes('tc') || statusNorm.includes('coordinator')) && !statusNorm.includes('manager');
              const isPendingManager = (statusNorm.includes('manager') || statusNorm.includes('mgr')) && !statusNorm.includes('completed') && !statusNorm.includes('waiting');
              const isPendingBusiness = statusNorm.includes('business');

              if (userTier === 3 && (isPendingStaff || isPendingTC || isPendingManager)) {
                return (
                  <WorkflowSubmitButton
                    label="Submit Issue"
                    onClickDirect={() => onAdvanceWorkflow('Ready for Director Submission' as any)}
                    onOpenRemarks={() =>
                      onOpenRemarksModal({
                        isOpen: true,
                        title: 'Submit Issue for Manager Review Completion',
                        actionLabel: 'Submit Issue',
                        targetStatus: 'Ready for Director Submission' as any,
                      })
                    }
                  />
                );
              }

              if (userTier === 2 && (isPendingStaff || isPendingTC)) {
                return (
                  <WorkflowSubmitButton
                    label="Submit to Manager"
                    onClickDirect={() => onAdvanceWorkflow('Pending Manager')}
                    onOpenRemarks={() =>
                      onOpenRemarksModal({
                        isOpen: true,
                        title: 'Submit Finding to Audit Manager',
                        actionLabel: 'Submit to Manager',
                        targetStatus: 'Pending Manager',
                      })
                    }
                  />
                );
              }

              if (userTier === 1 && isPendingStaff) {
                return (
                  <WorkflowSubmitButton
                    label="Submit to TC"
                    onClickDirect={() => onAdvanceWorkflow('Pending TC')}
                    onOpenRemarks={() =>
                      onOpenRemarksModal({
                        isOpen: true,
                        title: 'Submit Finding to Team Coordinator',
                        actionLabel: 'Submit to TC',
                        targetStatus: 'Pending TC',
                      })
                    }
                  />
                );
              }

              if (isPendingBusiness) {
                return (
                  <WorkflowSubmitButton
                    label="Submit Response"
                    onClickDirect={() => onAdvanceWorkflow('Pending Manager')}
                    onOpenRemarks={() =>
                      onOpenRemarksModal({
                        isOpen: true,
                        title: 'Submit Management Response to Audit Team',
                        actionLabel: 'Submit Response',
                        targetStatus: 'Pending Manager',
                      })
                    }
                  />
                );
              }

              if (userTier === 99) {
                if (isPendingStaff) {
                  return (
                    <WorkflowSubmitButton
                      label="Submit to TC"
                      onClickDirect={() => onAdvanceWorkflow('Pending TC')}
                      onOpenRemarks={() =>
                        onOpenRemarksModal({
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
                        onOpenRemarksModal({
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
                        onOpenRemarksModal({
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
              title="Issue actions (Call Back, Send To, Functional Scope, Exclusion, Track Changes, Workflow)"
              items={[
                ...(onOpenCallback
                  ? [
                    {
                      key: 'call-back',
                      label: 'Call Back',
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
                      title: !canCallBack
                        ? !canEdit
                          ? 'Call Back is not available for Non-Function issues.'
                          : `Call Back is not valid: this finding is currently in ${issue.status || 'current stage'}, which has not progressed past your review tier (${userRole || 'Reviewer'}).`
                        : 'Call back this finding from higher review stage to your review bucket',
                    },
                  ]
                  : []),
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
                      title: !canSendTo
                        ? 'Send To is not available for this finding in its current state.'
                        : 'Hand over this finding to another assigned team member on this engagement',
                    },
                  ]
                  : []),
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
                {
                  key: 'track-changes',
                  label: 'Track Changes',
                  icon: <History style={{ width: '13px', height: '13px', color: '#eb1700' }} />,
                  onClick: () => onOpenLogs(),
                  title: 'View audit trail history and field-level track changes for this finding',
                },
                {
                  key: 'workflow',
                  label: 'Workflow',
                  icon: <GitBranch style={{ width: '13px', height: '13px', color: '#000099' }} />,
                  onClick: () => onOpenWorkflow?.(),
                  title: 'View workflow pipeline and review stage progression for this finding',
                },
              ]}
            />
          </div>
        )}
      </div>
    </div>
  );
};

