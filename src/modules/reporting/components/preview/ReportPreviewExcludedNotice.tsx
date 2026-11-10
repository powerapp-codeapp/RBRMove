import React from 'react';
import { Ban, RotateCcw } from 'lucide-react';
import { SharedButton } from '../../../../components/shared/buttons/SharedButton';

interface ReportPreviewExcludedNoticeProps {
  onIncludeIssue: () => void;
}

export const ReportPreviewExcludedNotice: React.FC<ReportPreviewExcludedNoticeProps> = ({
  onIncludeIssue,
}) => {
  return (
    <div
      style={{
        padding: '10px 14px',
        marginBottom: '16px',
        borderRadius: '6px',
        backgroundColor: '#F8FAFC',
        border: '1.5px dashed #94A3B8',
        color: '#475569',
        fontSize: 'var(--type-caption-size, 11.5px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Ban style={{ width: '15px', height: '15px', color: '#64748B' }} />
        <span>
          <strong>Notice:</strong> This issue is currently <strong>Excluded</strong> and
          omitted from the final generated report findings.
        </span>
      </div>
      <SharedButton
        variant="success"
        size="small"
        startIcon={<RotateCcw size={11} />}
        onClick={onIncludeIssue}
        style={{
          minHeight: 'var(--control-min-height-compact, 1.5rem)',
          fontSize: 'var(--type-caption-size, 11px)',
          padding: '0 10px',
        }}
      >
        Include in Report
      </SharedButton>
    </div>
  );
};

