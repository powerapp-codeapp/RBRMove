import React, { useState, useEffect } from 'react';
import { RotateCcw, X } from 'lucide-react';
import type { Issue } from '../../../types/dataverse.types';
import { SharedButton } from '../../../components/shared/buttons/SharedButton';
import { SharedTextArea } from '../../../components/shared/inputs/SharedTextArea';

interface CallbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  issue: Issue | null;
  onConfirmCallback: (issueId: string, reason: string) => void;
}

export const CallbackModal: React.FC<CallbackModalProps> = ({
  isOpen,
  onClose,
  issue,
  onConfirmCallback,
}) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setReason('');
      setError('');
    }
  }, [isOpen]);

  if (!isOpen || !issue) return null;

  const handleConfirm = () => {
    if (!reason.trim()) {
      setError('Please provide a reason for calling back this issue.');
      return;
    }
    onConfirmCallback(issue.id, reason.trim());
    onClose();
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
                Call Back Issue
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
                {issue.title || 'Specify the reason for calling back this audit issue.'}
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
          <p className="type-caption" style={{ margin: '0 0 12px', fontSize: 'var(--type-caption-size, 12px)', color: '#64748B', lineHeight: '1.4' }}>
            Please provide details explaining why this issue is being recalled or returned to the previous review stage.
          </p>

          <SharedTextArea
            label="Reason for Call Back"
            required
            value={reason}
            onChange={(val) => {
              setReason(val);
              if (error) setError('');
            }}
            placeholder="Enter justification for recall / return to previous stage..."
            rows={4}
            error={Boolean(error)}
            errorMessage={error || undefined}
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
          >
            Cancel
          </SharedButton>
          <SharedButton
            variant="primary"
            size="small"
            startIcon={<RotateCcw size={13} />}
            onClick={handleConfirm}
          >
            Confirm Call Back
          </SharedButton>
        </div>
      </div>
    </div>
  );
};
