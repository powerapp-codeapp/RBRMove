import React from 'react';
import {
  CheckCircle2,
  Clock,
  AlertCircle,
  Building2,
  ShieldCheck,
  Calendar,
  Paperclip,
  Edit3,
} from 'lucide-react';
import type { Issue } from '../../../../types/dataverse.types';
import { SharedTextArea, SharedButton } from '../../../../components/shared';

interface WorkpaperBusinessResponseTabProps {
  issue: Issue;
  isBizResponseEmpty: boolean;
  isEditingBizOnBehalf: boolean;
  canAddBizOnBehalf: boolean;
  onToggleBizOnBehalf: (active: boolean) => void;
  currentCommentUserName?: string;
  currentCommentUserRole?: string;
  userRole?: string;
  renderCommentTrigger: (fieldKey: string, fieldLabel: string) => React.ReactNode;
}

export const WorkpaperBusinessResponseTab: React.FC<WorkpaperBusinessResponseTabProps> = ({
  issue,
  isBizResponseEmpty,
  isEditingBizOnBehalf,
  canAddBizOnBehalf,
  onToggleBizOnBehalf,
  currentCommentUserName,
  currentCommentUserRole,
  userRole,
  renderCommentTrigger,
}) => {
  const hasResponse = !isBizResponseEmpty;
  const isPendingWithBusiness =
    issue.businessResponseStatus === 'Pending with Business' ||
    issue.businessResponseStatus === 2 ||
    issue.status === 'Pending Business';
  const isCompleted =
    issue.businessResponseStatus === 'Completed' ||
    issue.businessResponseStatus === 3 ||
    hasResponse;

  const isAuditTeamSource =
    issue.businessResponseBy === 'Audit Team' ||
    issue.businessResponseBy === 2 ||
    Boolean(issue.businessResponseAddedOnBehalfBy || issue.businessManagementReason);

  const agreedDate = issue.agreedRemediationDate || issue.remediationTargetDate;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        flexShrink: 0,
      }}
    >
      {/* Top Status & Attribution Ribbon */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '8px',
          padding: '8px 12px',
          backgroundColor: '#F8FAFC',
          borderRadius: '6px',
          border: '1px solid #E2E8F0',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
          {/* Status Badge */}
          {isCompleted ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                borderRadius: '999px',
                fontSize: '11.5px',
                fontWeight: 600,
                backgroundColor: '#DCFCE7',
                color: '#15803D',
                border: '1px solid #86EFAC',
              }}
            >
              <CheckCircle2 size={13} />
              Response Completed
            </span>
          ) : isPendingWithBusiness ? (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                borderRadius: '999px',
                fontSize: '11.5px',
                fontWeight: 600,
                backgroundColor: '#FEF3C7',
                color: '#B45309',
                border: '1px solid #FCD34D',
              }}
            >
              <Clock size={13} />
              Pending with Business
            </span>
          ) : (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                borderRadius: '999px',
                fontSize: '11.5px',
                fontWeight: 600,
                backgroundColor: '#F1F5F9',
                color: '#64748B',
                border: '1px solid #CBD5E1',
              }}
            >
              <AlertCircle size={13} />
              Response Not Started
            </span>
          )}

          {/* Source Attribution Badge */}
          {hasResponse && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 500,
                backgroundColor: isAuditTeamSource ? '#EFF6FF' : '#F3E8FF',
                color: isAuditTeamSource ? '#1E40AF' : '#6B21A8',
                border: `1px solid ${isAuditTeamSource ? '#BFDBFE' : '#D8B4FE'}`,
              }}
            >
              {isAuditTeamSource ? (
                <>
                  <ShieldCheck size={13} />
                  Source: Audit Team (On-Behalf)
                </>
              ) : (
                <>
                  <Building2 size={13} />
                  Source: Business Owner Direct
                </>
              )}
            </span>
          )}

          {/* Target Remediation Date Badge */}
          {agreedDate && (
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '3px 8px',
                borderRadius: '999px',
                fontSize: '11px',
                fontWeight: 500,
                backgroundColor: '#F8FAFC',
                color: '#334155',
                border: '1px solid #CBD5E1',
              }}
            >
              <Calendar size={13} />
              Target: {agreedDate}
            </span>
          )}
        </div>

        {/* Action Button: Edit on behalf if already completed */}
        {hasResponse && canAddBizOnBehalf && (
          <SharedButton
            variant="secondary"
            size="small"
            onClick={() => onToggleBizOnBehalf(true)}
            style={{ fontSize: '11.5px', padding: '4px 10px', height: '28px' }}
          >
            <Edit3 size={12} style={{ marginRight: '4px' }} />
            Edit Response on Behalf
          </SharedButton>
        )}
      </div>

      {/* Case 1: Business Response is empty -> Show "Add Business Response On-Behalf" toggle */}
      {isBizResponseEmpty ? (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '12px 14px',
            backgroundColor: '#F8FAFC',
            borderRadius: '6px',
            border: '1px dashed #CBD5E1',
          }}
        >
          <button
            type="button"
            role="switch"
            aria-checked={isEditingBizOnBehalf}
            disabled={!canAddBizOnBehalf}
            onClick={() => {
              if (canAddBizOnBehalf) {
                onToggleBizOnBehalf(!isEditingBizOnBehalf);
              }
            }}
            style={{
              width: '36px',
              height: '20px',
              borderRadius: '999px',
              backgroundColor: isEditingBizOnBehalf ? '#000099' : '#CBD5E1',
              border: 'none',
              padding: '2px',
              cursor: canAddBizOnBehalf ? 'pointer' : 'not-allowed',
              opacity: canAddBizOnBehalf ? 1 : 0.6,
              display: 'inline-flex',
              alignItems: 'center',
              transition: 'background-color 0.18s ease',
              flexShrink: 0,
            }}
          >
            <span
              style={{
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: '#FFFFFF',
                transform: isEditingBizOnBehalf ? 'translateX(16px)' : 'translateX(0)',
                transition: 'transform 0.18s ease',
                boxShadow: '0 1px 2px rgba(0, 0, 0, 0.2)',
              }}
            />
          </button>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span
              onClick={() => {
                if (canAddBizOnBehalf) {
                  onToggleBizOnBehalf(!isEditingBizOnBehalf);
                }
              }}
              style={{
                fontSize: '13px',
                fontWeight: 600,
                color: '#1E293B',
                cursor: canAddBizOnBehalf ? 'pointer' : 'not-allowed',
                opacity: canAddBizOnBehalf ? 1 : 0.6,
                userSelect: 'none',
              }}
            >
              Add Business Response On-Behalf
            </span>
            <span style={{ fontSize: '11.5px', color: '#64748B' }}>
              Record official management response and corrective actions agreed with the auditee offline.
            </span>
          </div>
        </div>
      ) : (
        /* Case 2: Business Response is present -> Show read-only field + attribution details */
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <SharedTextArea
            label="Business Management Response"
            value={issue.businessManagementResponse || issue.managementResponse || ''}
            onChange={() => {}}
            placeholder="Official management response and agreed corrective action plan..."
            rows={4}
            disabled
            extraHeaderActions={renderCommentTrigger(
              'businessManagementResponse',
              'Business Management Response'
            )}
          />

          {/* On-behalf Reason Callout */}
          {issue.businessManagementReason && (
            <div
              style={{
                padding: '8px 12px',
                backgroundColor: '#F8FAFC',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                display: 'flex',
                flexDirection: 'column',
                gap: '2px',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 700, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Reason for Adding on Behalf
              </span>
              <p style={{ margin: 0, fontSize: '12px', color: '#1E293B', lineHeight: '1.4' }}>
                {issue.businessManagementReason}
              </p>
            </div>
          )}

          {/* Attached offline evidence pill */}
          {issue.businessManagementAttachment && (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 12px',
                borderRadius: '6px',
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                alignSelf: 'flex-start',
                fontSize: '12px',
                color: '#1E40AF',
                fontWeight: 500,
              }}
            >
              <Paperclip size={13} />
              <span>Offline Evidence Attachment: <strong>{issue.businessManagementAttachment}</strong></span>
            </div>
          )}

          {/* Submitter Attribution Details */}
          <div
            style={{
              fontSize: '12px',
              color: '#64748B',
              fontWeight: 500,
              paddingLeft: '2px',
            }}
          >
            {isAuditTeamSource ? (
              <span>
                Business response added on-behalf by{' '}
                <strong style={{ color: '#334155', fontWeight: 600 }}>
                  {issue.businessResponseAddedOnBehalfBy || issue.businessResponseProvidedBy || currentCommentUserName || 'Auditor'}
                </strong>{' '}
                <span style={{ color: '#64748B', fontWeight: 400 }}>
                  ({issue.businessResponseAddedOnBehalfRole || currentCommentUserRole || userRole || 'Auditor'})
                </span>{' '}
                on{' '}
                <strong style={{ color: '#334155', fontWeight: 600 }}>
                  {issue.businessResponseAddedOnBehalfAt || issue.businessResponseProvidedAt || issue.updatedAt || issue.createdAt || ''}
                </strong>
              </span>
            ) : (
              <span>
                Business response provided by{' '}
                <strong style={{ color: '#334155', fontWeight: 600 }}>
                  {issue.businessResponseProvidedBy ||
                    issue.primaryBusinessOwnerName ||
                    issue.primaryContact ||
                    issue.businessContactName ||
                    issue.accountableContact ||
                    'Business Owner'}
                </strong>{' '}
                on{' '}
                <strong style={{ color: '#334155', fontWeight: 600 }}>
                  {issue.businessResponseProvidedAt || issue.updatedAt || issue.createdAt || ''}
                </strong>
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

