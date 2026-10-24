import React from 'react';
import { BackButton } from '../buttons/BackButton';

export interface PageHeaderProps {
  /** Main title displayed in the toolbar */
  title?: React.ReactNode;
  /** Optional secondary subtitle or metadata */
  subtitle?: React.ReactNode;
  /** Callback when back button is clicked. If not provided, back button is omitted */
  onBack?: () => void;
  /** Tooltip and ARIA label for back button */
  backTitle?: string;
  /** Navigation tab selector rendered inside the header bar (e.g. Audit Queue primary tabs) */
  tabs?: React.ReactNode;
  /** Action buttons rendered on the right side of the toolbar */
  actions?: React.ReactNode;
  /** Optional custom CSS classes */
  className?: string;
  /** Optional inline styles */
  style?: React.CSSProperties;
  /** Optional custom children rendered on the left/middle */
  children?: React.ReactNode;
}

/**
 * Standardized PageHeader / Studio Action Toolbar component.
 * Ensures 100% visual consistency in height, typography, drop shadow,
 * and responsive scaling across the Audit Queue, Studios, and Full-Page views.
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  onBack,
  backTitle = 'Back',
  tabs,
  actions,
  className = '',
  style,
  children,
}) => {
  return (
    <header
      className={`page-header-toolbar ${className}`}
      style={{
        minHeight: 'var(--studio-toolbar-height, 3.25rem)',
        padding: 'clamp(4px, 0.6vh, 8px) var(--space-page-padding-x, 20px)',
        borderBottom: 'none',
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.04)',
        position: 'relative',
        zIndex: 15,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexWrap: 'wrap',
        gap: '12px',
        backgroundColor: '#ffffff',
        flexShrink: 0,
        boxSizing: 'border-box',
        width: '100%',
        ...style,
      }}
    >
      {/* Left Section: Back Button, Title / Subtitle, Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
          minWidth: 0,
          flex: tabs && !title ? 1 : undefined,
        }}
      >
        {onBack && (
          <BackButton
            onClick={onBack}
            title={backTitle}
            ariaLabel={backTitle}
          />
        )}

        {title && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <h1
              className="type-studio-title"
              style={{
                fontSize: 'var(--type-studio-title-size, 15px)',
                fontWeight: 'var(--type-studio-title-weight, 500)' as any,
                color: 'var(--type-studio-title-color, #334155)',
                lineHeight: 'var(--type-studio-title-leading, 1.3)' as any,
                fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
                margin: 0,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              {title}
            </h1>
            {subtitle && (
              <span
                className="type-caption"
                style={{
                  fontSize: 'var(--type-caption-size, 11px)',
                  color: '#64748B',
                  fontWeight: 500,
                }}
              >
                {subtitle}
              </span>
            )}
          </div>
        )}

        {tabs}
        {children}
      </div>

      {/* Right Section: Action Buttons */}
      {actions && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            flexWrap: 'wrap',
          }}
        >
          {actions}
        </div>
      )}
    </header>
  );
};
