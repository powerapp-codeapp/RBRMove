import React from 'react';

export interface IssueBreakdownMetrics {
  total: number;
  totalIT: number;
  totalFin: number;
  inProgress: number;
  inProgressIT: number;
  inProgressFin: number;
  completed: number;
  completedIT: number;
  completedFin: number;
}

export interface QueueMetricsBarProps {
  breakdown: IssueBreakdownMetrics;
  style?: React.CSSProperties;
  className?: string;
}

export const QueueMetricsBar: React.FC<QueueMetricsBarProps> = ({
  breakdown,
  style,
  className,
}) => {
  return (
    <div
      className={`audit-queue-expanded-metrics-bar ${className || ''}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '16px',
        padding: '3px 10px',
        backgroundColor: '#ffffff',
        border: '1px solid #e2e8f0',
        borderRadius: '5px',
        boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
        marginBottom: '3px',
        ...style,
      }}
    >
      {/* 1. Total Issues Metric */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            fontSize: '10.5px',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: '#64748B',
            letterSpacing: '0.04em',
          }}
        >
          Total Issues:
        </span>
        <span style={{ fontSize: 'var(--type-table-row-size, 12px)', fontWeight: 400, color: '#334155' }}>
          {breakdown.total}
        </span>
        {(breakdown.totalIT > 0 || breakdown.totalFin > 0) && (
          <div style={{ display: 'inline-flex', gap: '3px' }}>
            {breakdown.totalIT > 0 && (
              <span
                className="type-badge"
                style={{
                  padding: '1px 4px',
                  borderRadius: '3px',
                  fontSize: 'var(--type-badge-size, 9.5px)',
                  fontWeight: 700,
                  backgroundColor: '#f1f4ff',
                  color: '#000099',
                  border: '1px solid #c5dbfc',
                }}
              >
                {breakdown.totalIT} IT
              </span>
            )}
            {breakdown.totalFin > 0 && (
              <span
                className="type-badge"
                style={{
                  padding: '1px 4px',
                  borderRadius: '3px',
                  fontSize: 'var(--type-badge-size, 9.5px)',
                  fontWeight: 700,
                  backgroundColor: '#fffbeb',
                  color: '#92400e',
                  border: '1px solid #fef3c7',
                }}
              >
                {breakdown.totalFin} Fin
              </span>
            )}
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ width: '1px', height: '14px', backgroundColor: '#e2e8f0' }} />

      {/* 2. In-Progress Metric */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            fontSize: '10.5px',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: '#64748B',
            letterSpacing: '0.04em',
          }}
        >
          In-Progress:
        </span>
        <span style={{ fontSize: 'var(--type-table-row-size, 12px)', fontWeight: 400, color: '#334155' }}>
          {breakdown.inProgress}
        </span>
        {(breakdown.inProgressIT > 0 || breakdown.inProgressFin > 0) && (
          <div style={{ display: 'inline-flex', gap: '3px' }}>
            {breakdown.inProgressIT > 0 && (
              <span
                className="type-badge"
                style={{
                  padding: '1px 4px',
                  borderRadius: '3px',
                  fontSize: 'var(--type-badge-size, 9.5px)',
                  fontWeight: 700,
                  backgroundColor: '#f1f4ff',
                  color: '#000099',
                  border: '1px solid #c5dbfc',
                }}
              >
                {breakdown.inProgressIT} IT
              </span>
            )}
            {breakdown.inProgressFin > 0 && (
              <span
                className="type-badge"
                style={{
                  padding: '1px 4px',
                  borderRadius: '3px',
                  fontSize: 'var(--type-badge-size, 9.5px)',
                  fontWeight: 700,
                  backgroundColor: '#fffbeb',
                  color: '#92400e',
                  border: '1px solid #fef3c7',
                }}
              >
                {breakdown.inProgressFin} Fin
              </span>
            )}
          </div>
        )}
      </div>

      {/* Divider */}
      <div style={{ width: '1px', height: '14px', backgroundColor: '#e2e8f0' }} />

      {/* 3. Completed Metric */}
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
        <span
          style={{
            fontSize: '10.5px',
            fontWeight: 700,
            textTransform: 'uppercase',
            color: '#64748B',
            letterSpacing: '0.04em',
          }}
        >
          Completed:
        </span>
        <span style={{ fontSize: 'var(--type-table-row-size, 12px)', fontWeight: 400, color: '#334155' }}>
          {breakdown.completed}
        </span>
        {(breakdown.completedIT > 0 || breakdown.completedFin > 0) && (
          <div style={{ display: 'inline-flex', gap: '3px' }}>
            {breakdown.completedIT > 0 && (
              <span
                className="type-badge"
                style={{
                  padding: '1px 4px',
                  borderRadius: '3px',
                  fontSize: 'var(--type-badge-size, 9.5px)',
                  fontWeight: 700,
                  backgroundColor: '#ecfdf5',
                  color: '#087d0d',
                  border: '1px solid #a7f3d0',
                }}
              >
                {breakdown.completedIT} IT
              </span>
            )}
            {breakdown.completedFin > 0 && (
              <span
                className="type-badge"
                style={{
                  padding: '1px 4px',
                  borderRadius: '3px',
                  fontSize: 'var(--type-badge-size, 9.5px)',
                  fontWeight: 700,
                  backgroundColor: '#ecfdf5',
                  color: '#087d0d',
                  border: '1px solid #a7f3d0',
                }}
              >
                {breakdown.completedFin} Fin
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default QueueMetricsBar;

