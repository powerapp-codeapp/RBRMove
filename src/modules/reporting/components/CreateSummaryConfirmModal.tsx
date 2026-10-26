import React from 'react';
import { FileText, X, AlertCircle, ExternalLink } from 'lucide-react';

interface CreateSummaryConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  engagementName: string;
}

export const CreateSummaryConfirmModal: React.FC<CreateSummaryConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  engagementName
}) => {
  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.45)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px'
      }}
      onClick={onClose}
    >
      <div
        style={{
          backgroundColor: '#ffffff',
          borderRadius: '12px',
          width: '100%',
          maxWidth: '520px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.15), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
          animation: 'fadeIn 0.18s ease-out'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #F1F5F9'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {/* Blue Rounded Square with Document Icon */}
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '10px',
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <FileText size={20} color="#000099" strokeWidth={2.2} />
            </div>

            {/* Title & Subtitle */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: '16px',
                  fontWeight: 700,
                  color: '#0F172A',
                  lineHeight: 1.25
                }}
              >
                Create Summary Report
              </h3>
              <span
                style={{
                  fontSize: '12.5px',
                  fontWeight: 500,
                  color: '#64748B',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  maxWidth: '380px'
                }}
                title={engagementName}
              >
                {engagementName}
              </span>
            </div>
          </div>

          {/* Close 'X' Button */}
          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: '6px',
              borderRadius: '6px',
              color: '#94A3B8',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background-color 0.15s ease, color 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.color = '#334155';
              e.currentTarget.style.backgroundColor = '#F1F5F9';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.color = '#94A3B8';
              e.currentTarget.style.backgroundColor = 'transparent';
            }}
            aria-label="Close dialog"
          >
            <X size={18} />
          </button>
        </div>

        {/* Body Content */}
        <div style={{ padding: '20px 22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <p
            style={{
              margin: 0,
              fontSize: '14px',
              fontWeight: 400,
              color: '#334155',
              lineHeight: 1.55
            }}
          >
            No issues are logged in this Engagement. Do you want to start preparing the summary report without issues?
          </p>

          {/* Callout Notice Box */}
          <div
            style={{
              backgroundColor: '#F8FAFC',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px'
            }}
          >
            <AlertCircle size={16} color="#D97706" style={{ flexShrink: 0 }} />
            <span
              style={{
                fontSize: '12.5px',
                fontWeight: 400,
                color: '#64748B',
                lineHeight: 1.45
              }}
            >
              You can still add or link issues to this audit at any time later.
            </span>
          </div>
        </div>

        {/* Footer Actions */}
        <div
          style={{
            padding: '14px 22px',
            backgroundColor: '#FAFAFA',
            borderTop: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '10px'
          }}
        >
          {/* Cancel Button */}
          <button
            type="button"
            onClick={onClose}
            style={{
              backgroundColor: '#FFFFFF',
              border: '1px solid #CBD5E1',
              borderRadius: '6px',
              padding: '7px 18px',
              fontSize: '13px',
              fontWeight: 600,
              color: '#334155',
              cursor: 'pointer',
              transition: 'background-color 0.15s ease, border-color 0.15s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#F8FAFC';
              e.currentTarget.style.borderColor = '#94A3B8';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#FFFFFF';
              e.currentTarget.style.borderColor = '#CBD5E1';
            }}
          >
            Cancel
          </button>

          {/* Create Summary Button */}
          <button
            type="button"
            onClick={onConfirm}
            style={{
              backgroundColor: '#EB1700',
              border: 'none',
              borderRadius: '6px',
              padding: '7px 18px',
              fontSize: '13px',
              fontWeight: 700,
              color: '#FFFFFF',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              boxShadow: '0 1px 2px rgba(235, 23, 0, 0.25)',
              transition: 'background-color 0.15s ease, transform 0.1s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#D01400';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#EB1700';
            }}
            onMouseDown={(e) => {
              e.currentTarget.style.transform = 'scale(0.98)';
            }}
            onMouseUp={(e) => {
              e.currentTarget.style.transform = 'none';
            }}
          >
            <ExternalLink size={14} strokeWidth={2.4} />
            Create Summary
          </button>
        </div>
      </div>
    </div>
  );
};
