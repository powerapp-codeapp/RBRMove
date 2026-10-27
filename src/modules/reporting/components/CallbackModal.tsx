import React, { useState, useEffect } from 'react';
import { RotateCcw, X, ArrowRight, UserCheck } from 'lucide-react';
import type { Issue } from '../../../types/dataverse.types';
import { SharedButton } from '../../../components/shared/buttons/SharedButton';
import { SharedTextArea } from '../../../components/shared/inputs/SharedTextArea';
import { deriveTargetStatusForRole } from '../../../services/dataverseReportingService';

interface CallbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  issue: Issue | null;
  currentUser?: { name?: string; role?: string; email?: string; userId?: string };
  userRole?: string;
  onConfirmCallback: (issueId: string, reason: string, targetStatus: string) => Promise<void> | void;
}

export const CallbackModal: React.FC<CallbackModalProps> = ({
  isOpen,
  onClose,
  issue,
  currentUser,
  userRole,
  onConfirmCallback,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  if (!isOpen || !issue) return null;

  const effectiveRole = userRole || currentUser?.role || 'Staff Auditor';
  const targetInfo = deriveTargetStatusForRole(effectiveRole);

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError('Please provide a mandatory justification explaining why this finding is being called back.');
      return;
    }
    try {
      setIsSubmitting(true);
      await onConfirmCallback(issue.id, reason.trim(), targetInfo.statusText);
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to call back issue. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(3px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '8px',
          maxWidth: '540px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.2)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #D8D8D8',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            backgroundColor: '#F8FAFC',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
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
              <RotateCcw style={{ width: '18px', height: '18px' }} />
            </div>
            <div>
              <h3
                className="type-modal-title"
                style={{
                  margin: 0,
                  fontSize: 'var(--type-modal-title-size, 15px)',
                  fontWeight: 800,
                  color: '#0F172A',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                Call Back Finding
                <span
                  className="type-badge"
                  style={{
                    fontSize: 'var(--type-badge-size, 11px)',
                    fontWeight: 700,
                    padding: '2px 8px',
                    borderRadius: '4px',
                    backgroundColor: '#EFF6FF',
                    color: '#000099',
                    border: '1px solid #BFDBFE',
                  }}
                >
                  {issue.testProcedureCode || issue.id}
                </span>
              </h3>
              <p className="type-caption" style={{ margin: '2px 0 0', fontSize: 'var(--type-caption-size, 11.5px)', color: '#64748B' }}>
                {issue.title || 'Pull this audit finding back into your active review stage.'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close Call Back dialog"
            style={{
              background: 'none',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: '4px',
              borderRadius: '4px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '28px',
              height: '28px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#000099';
              e.currentTarget.style.backgroundColor = '#E2E8F0';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94A3B8';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            title="Close"
          >
            <X style={{ width: '18px', height: '18px' }} />
          </button>
        </div>

        {/* Modal Body */}
        <div style={{ padding: '20px' }}>
          {/* Review Stage Transition Preview Card */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              borderRadius: '6px',
              border: '1px solid #E2E8F0',
              padding: '12px 14px',
              marginBottom: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: '8px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              <span>Stage Transition</span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#000099', textTransform: 'none', fontWeight: 600 }}>
                <UserCheck size={12} />
                {currentUser?.name || 'Reviewer'} ({effectiveRole})
              </span>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '10px', color: '#64748B' }}>Current Stage</span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#92400E',
                    backgroundColor: '#FEF3C7',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid #FDE68A',
                  }}
                >
                  {issue.status || 'In Review'}
                </span>
              </div>

              <ArrowRight size={14} color="#94A3B8" style={{ marginTop: '12px' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '10px', color: '#000099', fontWeight: 600 }}>Pulling Down To</span>
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: 700,
                    color: '#000099',
                    backgroundColor: '#EFF6FF',
                    padding: '3px 8px',
                    borderRadius: '4px',
                    border: '1px solid #BFDBFE',
                  }}
                >
                  {targetInfo.statusText}
                </span>
              </div>
            </div>

            <p style={{ margin: '4px 0 0', fontSize: '11.5px', color: '#64748B', lineHeight: '1.4' }}>
              This action recalls the observation from higher-level review. It re-assigns active ownership to you and logs a regulatory audit trail entry.
            </p>
          </div>

          <SharedTextArea
            label="Mandatory Reason for Call Back"
            required
            value={reason}
            onChange={(val) => {
              setReason(val);
              if (error) setError('');
            }}
            placeholder="Specify why this finding requires further fieldwork, revisions, or clarification..."
            rows={4}
            error={Boolean(error)}
            errorMessage={error || undefined}
            disabled={isSubmitting}
          />
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '12px 20px',
            backgroundColor: '#F8FAFC',
            borderTop: '1px solid #E2E8F0',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
          }}
        >
          <SharedButton
            variant="outline"
            size="small"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </SharedButton>
          <SharedButton
            variant="primary"
            size="small"
            startIcon={<RotateCcw size={13} />}
            onClick={handleConfirm}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Calling Back...' : 'Confirm Call Back'}
          </SharedButton>
        </div>
      </div>
    </div>
  );
};

