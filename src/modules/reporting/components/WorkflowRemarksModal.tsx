import React, { useState, useEffect } from 'react';
import { Send, X, AlertCircle } from 'lucide-react';
import { SharedButton } from '../../../components/shared/buttons/SharedButton';
import { SharedTextArea } from '../../../components/shared/inputs/SharedTextArea';

export interface WorkflowRemarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  actionLabel: string;
  itemTitle?: string;
  targetStatusText?: string;
  initialRemarks?: string;
  onConfirm: (remarks: string) => Promise<void> | void;
}

export const WorkflowRemarksModal: React.FC<WorkflowRemarksModalProps> = ({
  isOpen,
  onClose,
  title,
  actionLabel,
  itemTitle,
  targetStatusText,
  initialRemarks = '',
  onConfirm,
}) => {
  const [remarks, setRemarks] = useState(initialRemarks);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (isOpen) {
      setRemarks(initialRemarks);
      setIsSubmitting(false);
      setErrorMessage('');
    }
  }, [isOpen, initialRemarks]);

  if (!isOpen) return null;

  const handleConfirm = async () => {
    try {
      setIsSubmitting(true);
      setErrorMessage('');
      await onConfirm(remarks.trim());
      onClose();
    } catch (err: any) {
      console.error('[WorkflowRemarksModal] Transition failed:', err);
      setErrorMessage(err?.message || 'Failed to complete workflow transition. Please try again.');
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
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 20px',
            borderBottom: '1px solid #E2E8F0',
            backgroundColor: '#F8FAFC',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: '#EEF2FF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000099',
              }}
            >
              <Send size={16} />
            </div>
            <div>
              <h3
                style={{
                  margin: 0,
                  fontSize: '15px',
                  fontWeight: 600,
                  color: '#0F172A',
                  fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
                }}
              >
                {title}
              </h3>
              <p
                style={{
                  margin: 0,
                  fontSize: '11px',
                  color: '#64748B',
                  fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
                }}
              >
                {targetStatusText ? `Transitioning to ${targetStatusText}` : 'Audit workflow transition'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              color: '#64748B',
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

        {/* Modal Body */}
        <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          {itemTitle && (
            <div
              style={{
                backgroundColor: '#F8FAFC',
                border: '1px solid #E2E8F0',
                borderRadius: '6px',
                padding: '10px 14px',
                display: 'flex',
                flexDirection: 'column',
                gap: '4px',
              }}
            >
              <span style={{ fontSize: '11px', fontWeight: 600, color: '#64748B', textTransform: 'uppercase' }}>
                Item Under Review
              </span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#1E293B' }}>
                {itemTitle}
              </span>
            </div>
          )}

          <div>
            <label
              style={{
                display: 'block',
                fontSize: '12px',
                fontWeight: 600,
                color: '#334155',
                marginBottom: '6px',
                fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
              }}
            >
              Reviewer Remarks (Optional)
            </label>
            <SharedTextArea
              value={remarks}
              onChange={(val) => setRemarks(val)}
              placeholder="Enter any context, notes, or instructions for the next reviewer (optional)..."
              rows={4}
              fullWidth
            />
            <span style={{ display: 'block', marginTop: '4px', fontSize: '11px', color: '#64748B' }}>
              These remarks will be permanently recorded in the Dataverse audit trail log (<code>iar_issuelogses</code>).
            </span>
          </div>

          {errorMessage && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                backgroundColor: '#FEF2F2',
                border: '1px solid #FCA5A5',
                borderRadius: '6px',
                padding: '8px 12px',
                color: '#DC2626',
                fontSize: '12px',
              }}
            >
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              <span>{errorMessage}</span>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px',
            padding: '14px 20px',
            borderTop: '1px solid #E2E8F0',
            backgroundColor: '#F8FAFC',
          }}
        >
          <SharedButton
            variant="outline"
            size="small"
            onClick={onClose}
            disabled={isSubmitting}
            style={{ minHeight: '32px', padding: '0 14px' }}
          >
            Cancel
          </SharedButton>
          <SharedButton
            variant="primary"
            size="small"
            onClick={handleConfirm}
            loading={isSubmitting}
            startIcon={<Send size={13} />}
            style={{ minHeight: '32px', padding: '0 16px', backgroundColor: '#000099', borderColor: '#000099' }}
          >
            {actionLabel}
          </SharedButton>
        </div>
      </div>
    </div>
  );
};
