import React, { useState, useEffect } from 'react';
import { Ban, X, AlertTriangle } from 'lucide-react';
import type { Issue } from '../../../types/dataverse.types';
import { SharedButton } from '../../../components/shared/buttons/SharedButton';
import { SharedTextArea } from '../../../components/shared/inputs/SharedTextArea';

interface ExcludeIssueModalProps {
  isOpen: boolean;
  onClose: () => void;
  issue: Issue | null;
  currentUser?: { name?: string; role?: string; email?: string; userId?: string };
  onConfirmExclude: (issueId: string, reason: string) => Promise<void> | void;
}

export const ExcludeIssueModal: React.FC<ExcludeIssueModalProps> = ({
  isOpen,
  onClose,
  issue,
  onConfirmExclude,
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

  const handleConfirm = async () => {
    if (!reason.trim()) {
      setError('Please provide a mandatory exclusion justification before excluding this finding.');
      return;
    }
    try {
      setIsSubmitting(true);
      await onConfirmExclude(issue.id, reason.trim());
      onClose();
    } catch (e: any) {
      setError(e?.message || 'Failed to exclude issue. Please try again.');
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
          maxWidth: '520px',
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
            backgroundColor: '#FEF2F2',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '8px',
                backgroundColor: '#FEE2E2',
                border: '1px solid #FECACA',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#DC2626',
                flexShrink: 0,
              }}
            >
              <Ban size={20} />
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: '15.5px',
                  fontWeight: 700,
                  color: '#991B1B',
                  letterSpacing: '-0.01em',
                }}
              >
                Exclude Finding from Audit Report
              </h3>
              <p
                style={{
                  margin: '2px 0 0',
                  fontSize: '12px',
                  color: '#B91C1C',
                }}
              >
                Soft exclusion of finding from report compilation and executive summary
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            aria-label="Close modal"
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
            }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Modal Body: Only Mandatory Exclusion Justification */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <SharedTextArea
            label="Mandatory Exclusion Justification *"
            value={reason}
            onChange={(val) => {
              setReason(val);
              if (val.trim()) setError('');
            }}
            placeholder="Provide the mandatory operational or audit rationale for excluding this finding from report compilation..."
            rows={4}
          />
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                color: '#DC2626',
                fontSize: '11.5px',
                marginTop: '4px',
              }}
            >
              <AlertTriangle size={13} />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            padding: '14px 20px',
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
            style={{ minHeight: '34px', fontSize: '12.5px', padding: '0 14px' }}
          >
            Cancel
          </SharedButton>
          <SharedButton
            variant="danger"
            size="small"
            startIcon={<Ban size={14} />}
            onClick={handleConfirm}
            loading={isSubmitting}
            style={{
              minHeight: '34px',
              fontSize: '12.5px',
              padding: '0 16px',
              backgroundColor: '#DC2626',
              color: '#FFFFFF',
            }}
          >
            Exclude Finding
          </SharedButton>
        </div>
      </div>
    </div>
  );
};
