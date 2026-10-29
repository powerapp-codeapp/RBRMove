import React, { useState, useEffect } from 'react';
import { Send, ArrowRight } from 'lucide-react';
import { SharedButton } from '../../../components/shared/buttons/SharedButton';
import { SharedTextArea } from '../../../components/shared/inputs/SharedTextArea';

export interface WorkflowRemarksModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  actionLabel: string;
  itemTitle?: string;
  currentStatusText?: string;
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
  currentStatusText,
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
            <Send style={{ width: '15px', height: '15px' }} />
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
            {itemTitle || title}
          </h3>
        </div>

        {/* Modal Body: Current Stage -> Submitting To (no container background) + Optional Remarks input */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flexWrap: 'wrap' }}>
            {currentStatusText && (
              <>
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
                    {currentStatusText}
                  </span>
                </div>

                <ArrowRight size={15} color="#94A3B8" style={{ marginTop: '16px' }} />
              </>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 500 }}>Submitting To</span>
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
                {targetStatusText || 'Next Review Stage'}
              </span>
            </div>
          </div>

          <SharedTextArea
            label="Remarks"
            value={remarks}
            onChange={(val) => {
              setRemarks(val);
              if (errorMessage) setErrorMessage('');
            }}
            placeholder="Enter any review notes or remarks for the next stage (optional)..."
            rows={4}
            error={Boolean(errorMessage)}
            errorMessage={errorMessage || undefined}
            disabled={isSubmitting}
          />
        </div>

        {/* Modal Footer: No background, no horizontal line/border, only Cancel and Submit buttons */}
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
            {isSubmitting ? 'Submitting...' : actionLabel || 'Submit'}
          </SharedButton>
        </div>
      </div>
    </div>
  );
};
