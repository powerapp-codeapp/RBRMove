import React from 'react';
import { PanelRightOpen } from 'lucide-react';

interface ReportPreviewRailProps {
  onExpand: () => void;
}

export const ReportPreviewRail: React.FC<ReportPreviewRailProps> = ({ onExpand }) => {
  return (
    <div
      style={{
        width: '36px',
        minWidth: '36px',
        backgroundColor: '#E8EDF2',
        borderLeft: 'none',
        boxShadow: '-2px 0 6px rgba(0, 0, 0, 0.04)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        paddingTop: '10px',
        gap: '16px',
        userSelect: 'none',
        flexShrink: 0,
        height: '100%',
      }}
    >
      <button
        type="button"
        onClick={onExpand}
        title="Expand Report Preview"
        aria-label="Expand Report Preview"
        style={{
          background: 'none',
          border: 'none',
          padding: '4px',
          color: '#64748B',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          width: '28px',
          height: '28px',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = '#000099';
          e.currentTarget.style.backgroundColor = '#CBD5E1';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = '#64748B';
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
      >
        <PanelRightOpen style={{ width: '16px', height: '16px' }} />
      </button>
      <div
        className="type-caption"
        style={{
          writingMode: 'vertical-rl',
          transform: 'rotate(180deg)',
          fontSize: 'var(--type-caption-size, 11px)',
          fontWeight: 800,
          color: '#475569',
          letterSpacing: '1px',
          whiteSpace: 'nowrap',
        }}
      >
        REPORT PREVIEW
      </div>
    </div>
  );
};

