import React from 'react';
import type { Issue, AuditTrailLog } from '../../../types/dataverse.types';
import { WorkflowModal } from './WorkflowModal';
import { AiVersionCompareDialog } from './AiVersionCompareDialog';
import { CreateIssueDialog } from './CreateIssueDialog';
import { IssueLogsDialog } from './IssueLogsDialog';
import { CallbackModal } from './CallbackModal';
import { SendToModal } from './SendToModal';
import { ExcludeIssueModal } from './ExcludeIssueModal';
import { InactivityCountdownModal } from './InactivityCountdownModal';
import { WorkflowRemarksModal } from './WorkflowRemarksModal';

export interface StudioDialogContainerProps {
  // Workflow Modal
  isWorkflowModalOpen: boolean;
  onCloseWorkflowModal: () => void;
  workflowScope: 'issue' | 'report';
  activeEngagement: any;
  selectedIssue: Issue | null;
  issues: Issue[];

  // AI Compare Dialog
  isAiCompareOpen: boolean;
  onCloseAiCompare: () => void;
  onApplyAiMerge: (mergedFields: Partial<Issue>) => void;

  // Create Issue Dialog
  isCreateOpen: boolean;
  onCloseCreate: () => void;
  selectedEngagementId?: string | null;
  currentRole: string;
  currentUser: any;
  onCreateNewIssue: (newFinding: any, statusAction?: 'draft' | 'submit') => Promise<void> | void;

  // Issue / Report Logs Dialog
  isLogsOpen: boolean;
  onCloseLogs: () => void;
  logsScope: 'issue' | 'report';
  auditLogs: AuditTrailLog[];

  // Callback Modal
  isCallbackModalOpen: boolean;
  onCloseCallback: () => void;
  callbackTargetIssue: Issue | null;
  onConfirmCallback: (issueId: string, reason: string, targetStatus: string) => Promise<void> | void;

  // Send To Modal
  isSendToModalOpen: boolean;
  onCloseSendTo: () => void;
  sendToTargetIssue: Issue | null;
  onConfirmSendTo: (issueId: string, recipient: any, remarks: string) => Promise<void> | void;

  // Exclude Modal
  isExcludeModalOpen: boolean;
  onCloseExclude: () => void;
  issueToExclude: Issue | null;
  onConfirmExclude: (issueId: string, reason: string) => Promise<void>;

  // Inactivity Lock Modal
  isWarningOpen: boolean;
  secondsRemaining: number;
  onKeepWorking: () => void;
  onManualUnlock: () => void;

  // Report Workflow Remarks Modal
  reportRemarksConfig: {
    isOpen: boolean;
    title: string;
    actionLabel: string;
    currentStatus?: string;
    targetStatus: string;
    actionType: string;
  } | null;
  onCloseReportRemarks: () => void;
  onConfirmReportRemarks: (remarks: string) => Promise<void>;
}

export const StudioDialogContainer: React.FC<StudioDialogContainerProps> = ({
  isWorkflowModalOpen,
  onCloseWorkflowModal,
  workflowScope,
  activeEngagement,
  selectedIssue,
  issues,
  isAiCompareOpen,
  onCloseAiCompare,
  onApplyAiMerge,
  isCreateOpen,
  onCloseCreate,
  selectedEngagementId,
  currentRole,
  currentUser,
  onCreateNewIssue,
  isLogsOpen,
  onCloseLogs,
  logsScope,
  auditLogs,
  isCallbackModalOpen,
  onCloseCallback,
  callbackTargetIssue,
  onConfirmCallback,
  isSendToModalOpen,
  onCloseSendTo,
  sendToTargetIssue,
  onConfirmSendTo,
  isExcludeModalOpen,
  onCloseExclude,
  issueToExclude,
  onConfirmExclude,
  isWarningOpen,
  secondsRemaining,
  onKeepWorking,
  onManualUnlock,
  reportRemarksConfig,
  onCloseReportRemarks,
  onConfirmReportRemarks,
}) => {
  const resolvedEngagementId = selectedEngagementId || activeEngagement?.id || '';
  const resolvedEngagementTitle =
    activeEngagement?.engagementName ||
    activeEngagement?.title ||
    activeEngagement?.engagement ||
    activeEngagement?.fileName ||
    resolvedEngagementId ||
    'Audit Report';

  return (
    <>
      {/* Workflow Modal */}
      <WorkflowModal
        isOpen={isWorkflowModalOpen}
        onClose={onCloseWorkflowModal}
        job={activeEngagement}
        issue={workflowScope === 'issue' ? (selectedIssue || undefined) : undefined}
        issues={issues}
        title={workflowScope === 'issue' ? 'Issue Workflow Pipeline' : 'Audit Report Workflow Pipeline'}
        type="audit"
      />

      {/* AI Version Comparison & Merge Dialog */}
      {selectedIssue && (
        <AiVersionCompareDialog
          open={isAiCompareOpen}
          onClose={onCloseAiCompare}
          currentIssue={selectedIssue}
          onApplyMerge={onApplyAiMerge}
        />
      )}

      {/* Add New Finding Dialog */}
      <CreateIssueDialog
        open={isCreateOpen}
        onClose={onCloseCreate}
        engagementId={resolvedEngagementId}
        engagementName={resolvedEngagementTitle}
        job={activeEngagement}
        userRole={currentRole}
        currentUser={currentUser}
        onSave={onCreateNewIssue}
      />

      {/* Event History & Track Changes Dialog */}
      <IssueLogsDialog
        open={isLogsOpen}
        onClose={onCloseLogs}
        issueId={selectedIssue?.id || ''}
        issueTitle={selectedIssue?.title || 'Audit Finding'}
        issue={selectedIssue}
        engagementId={resolvedEngagementId}
        engagementTitle={resolvedEngagementTitle}
        initialScope={logsScope}
        logs={auditLogs}
      />

      {/* Call Back Modal */}
      <CallbackModal
        isOpen={isCallbackModalOpen}
        onClose={onCloseCallback}
        issue={callbackTargetIssue}
        currentUser={currentUser}
        userRole={currentRole}
        onConfirmCallback={onConfirmCallback}
      />

      {/* Send To Peer Handover Modal */}
      <SendToModal
        isOpen={isSendToModalOpen}
        onClose={onCloseSendTo}
        issue={sendToTargetIssue}
        assignedUsers={activeEngagement?.assignedUsers || []}
        currentUser={currentUser}
        onConfirmSendTo={onConfirmSendTo}
      />

      {/* Exclude Finding Modal */}
      <ExcludeIssueModal
        isOpen={isExcludeModalOpen}
        onClose={onCloseExclude}
        issue={issueToExclude}
        currentUser={currentUser}
        onConfirmExclude={onConfirmExclude}
      />

      {/* Inactivity Warning & Auto-Unlock Countdown Modal */}
      <InactivityCountdownModal
        isOpen={isWarningOpen}
        secondsRemaining={secondsRemaining}
        onKeepWorking={onKeepWorking}
        onUnlockNow={onManualUnlock}
        issueTitle={selectedIssue?.title}
      />

      {/* Report-Level Workflow Transition with Remarks Modal */}
      <WorkflowRemarksModal
        isOpen={Boolean(reportRemarksConfig?.isOpen)}
        onClose={onCloseReportRemarks}
        title={reportRemarksConfig?.title || 'Report Workflow Transition'}
        actionLabel={reportRemarksConfig?.actionLabel || 'Submit'}
        itemTitle={resolvedEngagementTitle}
        currentStatusText={reportRemarksConfig?.currentStatus}
        targetStatusText={reportRemarksConfig?.targetStatus}
        onConfirm={onConfirmReportRemarks}
      />
    </>
  );
};

export default StudioDialogContainer;
