import React from 'react';

export interface StatusDotPillProps {
  status?: string;
  customLabel?: string;
  style?: React.CSSProperties;
}

export const StatusDotPill: React.FC<StatusDotPillProps> = ({
  status = 'Not Started',
  customLabel,
  style,
}) => {
  const displayLabel = customLabel || status || 'Not Started';
  const s = status || 'Not Started';

  let dotColor = '#94A3B8';
  let isDash = false;

  if (s === 'Completed') {
    dotColor = '#087D0D';
  } else if (s === 'Audit Report Inprogress' || s.includes('Audit')) {
    dotColor = '#000099';
  } else if (s === 'Executive Report Inprogress' || s.includes('Executive')) {
    dotColor = '#E67300';
  } else if (s === 'Not Started') {
    isDash = true;
  }

  if (isDash) {
    return (
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          whiteSpace: 'nowrap',
          ...style,
        }}
      >
        <span style={{ fontSize: 'var(--type-table-row-size, 12.5px)', fontWeight: 400, color: '#94A3B8' }}>
          —
        </span>
        <span style={{ fontSize: 'var(--type-table-row-size, 12.5px)', fontWeight: 400, color: '#64748B' }}>
          Not Started
        </span>
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '8px',
        whiteSpace: 'nowrap',
        ...style,
      }}
    >
      <span
        style={{
          width: '9px',
          height: '9px',
          borderRadius: '50%',
          backgroundColor: dotColor,
          flexShrink: 0,
        }}
      />
      <span
        style={{
          fontSize: 'var(--type-table-row-size, 12.5px)',
          fontWeight: 400,
          color: '#334155',
        }}
      >
        {displayLabel}
      </span>
    </div>
  );
};

export default StatusDotPill;

