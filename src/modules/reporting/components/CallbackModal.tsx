import React, { useState, useEffect } from 'react';
import { RotateCcw, ArrowRight } from 'lucide-react';
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
      setError('Please provide a reason for calling back this finding.');
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
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(2px)',
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
          maxWidth: '500px',
          width: '100%',
          boxShadow: '0 20px 40px rgba(0, 0, 0, 0.16)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          border: '1px solid #E2E8F0',
          padding: '20px 24px',
          gap: '18px',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header: Only Icon and Issue Name, no background, no separator, no close icon */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
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
            <RotateCcw style={{ width: '16px', height: '16px' }} />
          </div>
          <h3
            className="type-modal-title"
            style={{
              margin: 0,
              fontSize: 'var(--type-modal-title-size, 15px)',
              fontWeight: 700,
              color: '#0F172A',
              lineHeight: 1.35,
            }}
          >
            {issue.title || 'Untitled Issue'}
          </h3>
        </div>

        {/* Modal Body: Current Stage -> Pulling Down To (no container background) + Call Back Reason input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>Current Stage</span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#334155',
                  backgroundColor: '#FFFFFF',
                  padding: '3px 10px',
                  borderRadius: '4px',
                  border: '1px solid #CBD5E1',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                {issue.status || 'In Review'}
              </span>
            </div>

            <ArrowRight size={15} color="#94A3B8" style={{ marginTop: '16px' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>Pulling Down To</span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 600,
                  color: '#000099',
                  backgroundColor: '#EFF6FF',
                  padding: '3px 10px',
                  borderRadius: '4px',
                  border: '1px solid #BFDBFE',
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                {targetInfo.statusText}
              </span>
            </div>
          </div>

          <SharedTextArea
            label="Call Back Reason"
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
            slotProps={{
              inputBase: {
                sx: {
                  '& textarea::placeholder': {
                    fontWeight: '400 !important',
                    fontSize: 'var(--type-input-text-size, 12.5px)',
                    color: '#94A3B8',
                    opacity: 1,
                  },
                },
              },
            }}
          />
        </div>

        {/* Modal Footer: No background, no horizontal line/border, only Cancel and Confirm Call Back buttons */}
        <div
          style={{
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

