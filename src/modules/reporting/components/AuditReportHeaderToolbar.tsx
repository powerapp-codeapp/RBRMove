import React from 'react';
import { PageHeader, SharedSelectButton } from '../../../components/shared';
import { WorkflowSubmitButton } from './WorkflowSubmitButton';
import {
  FileText,
  Download,
  GitBranch,
  History,
  CheckCircle2,
  Eye,
} from 'lucide-react';

export interface AuditReportHeaderToolbarProps {
  onBack: () => void;
  engagementTitle: string;
  isUnassignedAdmin: boolean;
  isManager: boolean;
  isDirector: boolean;
  isVP: boolean;
  isUserAdmin: boolean;
  isPreDirectorStage: boolean;
  allReadyForDirector: boolean;
  allPendingDirector: boolean;
  allPendingVP: boolean;
  allCompleted: boolean;
  hasBusinessResponses: boolean;
  hasCriticalFinding: boolean;
  readyIssuesCount: number;
  totalActiveIssuesCount: number;
  onManagerSubmitToDirector: () => void;
  onOpenSubmitToDirectorRemarks: () => void;
  onDirectorSubmitToBusiness: () => void;
  onOpenSubmitToBusinessRemarks: () => void;
  onDirectorSubmitToVP: () => void;
  onOpenSubmitToVPRemarks: () => void;
  onSignOffAuditReport: () => void;
  onOpenSignOffRemarks: () => void;
  onDownloadReport: () => void;
  onOpenExecutiveReport: () => void;
  onOpenWorkflowModal: () => void;
  onOpenAuditTrailLogs: () => void;
}

export const AuditReportHeaderToolbar: React.FC<AuditReportHeaderToolbarProps> = ({
  onBack,
  engagementTitle,
  isUnassignedAdmin,
  isManager,
  isDirector,
  isVP,
  isUserAdmin,
  isPreDirectorStage,
  allReadyForDirector,
  allPendingDirector,
  allPendingVP,
  allCompleted,
  hasBusinessResponses,
  hasCriticalFinding,
  readyIssuesCount,
  totalActiveIssuesCount,
  onManagerSubmitToDirector,
  onOpenSubmitToDirectorRemarks,
  onDirectorSubmitToBusiness,
  onOpenSubmitToBusinessRemarks,
  onDirectorSubmitToVP,
  onOpenSubmitToVPRemarks,
  onSignOffAuditReport,
  onOpenSignOffRemarks,
  onDownloadReport,
  onOpenExecutiveReport,
  onOpenWorkflowModal,
  onOpenAuditTrailLogs,
}) => {
  return (
    <PageHeader
      onBack={onBack}
      backTitle="Back to Reporting Queue"
      title={`Audit Report — ${engagementTitle}`}
      actions={
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Administrator Oversight (Read-Only) Badge */}
          {isUnassignedAdmin && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '5px 12px',
                borderRadius: '6px',
                backgroundColor: '#FEF3C7',
                border: '1px solid #FCD34D',
                color: '#92400E',
                fontSize: '12px',
                fontWeight: 600,
              }}
              title="Administrator Oversight Mode (Read-Only): You are viewing this engagement across the portfolio. To advance review tiers or edit findings, use Impersonate User to act on behalf of an assigned auditor."
            >
              <Eye size={14} color="#B45309" />
              <span>Administrator Oversight (Read-Only)</span>
            </div>
          )}

          {/* 1. Pre-Director Stage: Submit to Director */}
          {(isManager || isUserAdmin) && isPreDirectorStage && (
            <WorkflowSubmitButton
              label="Submit to Director"
              disabled={!allReadyForDirector}
              title={
                allReadyForDirector
                  ? 'Batch ready — Submit Audit Report to Audit Director for review'
                  : `Complete Manager review on all active issues before submitting batch to Director (${readyIssuesCount} of ${totalActiveIssuesCount} ready).`
              }
              onClickDirect={onManagerSubmitToDirector}
              onOpenRemarks={onOpenSubmitToDirectorRemarks}
            />
          )}

          {/* 2. Audit Director: Submit to Business (Round 1) */}
          {(isDirector || isUserAdmin) && allPendingDirector && !hasBusinessResponses && (
            <WorkflowSubmitButton
              label="Submit to Business"
              onClickDirect={onDirectorSubmitToBusiness}
              onOpenRemarks={onOpenSubmitToBusinessRemarks}
            />
          )}

          {/* 3. Director / VP Report Submit: Submit to VP (Post-Business Response) */}
          {(isDirector || isUserAdmin) && allPendingDirector && hasBusinessResponses && (
            <WorkflowSubmitButton
              label="Submit to VP"
              variant={hasCriticalFinding ? 'primary' : 'secondary'}
              onClickDirect={onDirectorSubmitToVP}
              onOpenRemarks={onOpenSubmitToVPRemarks}
              title={
                hasCriticalFinding
                  ? 'Mandatory VP Sign-Off Rule (contains Critical finding)'
                  : 'Escalate Audit Report to Vice President for executive review'
              }
            />
          )}

          {/* 4. Director Report Action: Sign Off (Post-Business Response) */}
          {(isDirector || isUserAdmin) && allPendingDirector && hasBusinessResponses && (
            <WorkflowSubmitButton
              label="Sign Off"
              variant="success"
              disabled={hasCriticalFinding}
              onClickDirect={onSignOffAuditReport}
              onOpenRemarks={onOpenSignOffRemarks}
              title={
                hasCriticalFinding
                  ? 'Mandatory VP Sign-Off Rule: Contains Critical finding; sign-off must be performed by Vice President.'
                  : 'Officially complete and sign off the Audit Report'
              }
            />
          )}

          {/* 5. VP Report Action: Sign Off */}
          {(isVP || isUserAdmin) && allPendingVP && (
            <WorkflowSubmitButton
              label="Sign Off"
              variant="success"
              onClickDirect={onSignOffAuditReport}
              onOpenRemarks={onOpenSignOffRemarks}
              title="Officially complete and sign off the Audit Report"
            />
          )}

          {/* 6. Completed status indicator if all issues are Completed */}
          {allCompleted && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                padding: '4px 10px',
                borderRadius: '4px',
                backgroundColor: '#ECFDF5',
                border: '1px solid #A7F3D0',
                color: '#059669',
                fontSize: '12px',
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={14} />
              <span>Report Completed</span>
            </div>
          )}

          {/* Standard Report Actions Dropdown */}
          <SharedSelectButton
            label="Report Actions"
            size="small"
            menuWidth={230}
            title="Audit Report Actions"
            items={[
              {
                key: 'download-report',
                label: 'Download Report',
                icon: <Download style={{ width: '14px', height: '14px', color: '#000099' }} />,
                onClick: onDownloadReport,
              },
              {
                key: 'executive-report',
                label: 'Executive Report',
                icon: <FileText style={{ width: '14px', height: '14px', color: '#000099' }} />,
                onClick: onOpenExecutiveReport,
              },
              {
                key: 'workflow-stages',
                label: 'Workflow',
                icon: <GitBranch style={{ width: '14px', height: '14px', color: '#000099' }} />,
                onClick: onOpenWorkflowModal,
              },
              {
                key: 'audit-trail-logs',
                label: 'Track Changes',
                icon: <History style={{ width: '14px', height: '14px', color: '#eb1700' }} />,
                onClick: onOpenAuditTrailLogs,
              },
            ]}
          />
        </div>
      }
    />
  );
};

export default AuditReportHeaderToolbar;

