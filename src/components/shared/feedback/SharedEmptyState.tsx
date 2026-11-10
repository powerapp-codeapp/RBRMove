import React from 'react';

export interface SharedEmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}

export const SharedEmptyState: React.FC<SharedEmptyStateProps> = ({
  icon,
  title,
  description,
  action,
  style,
  className,
}) => {
  return (
    <div
      className={className}
      style={{
        padding: '48px',
        textAlign: 'center',
        backgroundColor: '#ffffff',
        borderRadius: '8px',
        border: '1px solid #edf0f5',
        boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
        color: '#64748B',
        ...style,
      }}
    >
      {icon && (
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '8px' }}>
          {icon}
        </div>
      )}
      <p style={{ fontWeight: 700, color: '#334155', margin: 0 }}>{title}</p>
      {description && (
        <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px', maxWidth: '640px', marginInline: 'auto' }}>
          {description}
        </p>
      )}
      {action && <div style={{ marginTop: '14px' }}>{action}</div>}
    </div>
  );
};

export default SharedEmptyState;

