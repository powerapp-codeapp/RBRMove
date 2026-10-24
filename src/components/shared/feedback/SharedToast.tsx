import React, { useEffect } from 'react';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export type ToastSeverity = 'success' | 'info' | 'warning' | 'error';
export type ToastPosition =
  | 'top-right'
  | 'top-left'
  | 'bottom-right'
  | 'bottom-left'
  | 'top-center'
  | 'bottom-center';

export interface SharedToastProps {
  /** Controls visibility of the toast */
  open: boolean;
  /** Callback fired when toast is dismissed manually or auto-dismiss timer finishes */
  onClose: () => void;
  /** Primary headline text */
  title?: string;
  /** Detailed explanatory body text */
  description?: string;
  /** Message alias (alternative to description) */
  message?: string;
  /** Severity / color theme (default: 'success') */
  severity?: ToastSeverity;
  /** Severity alias (alternative to severity) */
  variant?: ToastSeverity;
  /** Auto-dismiss duration in milliseconds (default: 4500ms; set 0 to disable auto-dismiss) */
  duration?: number;
  /** Screen position (default: 'top-right', anchored underneath the overall header) */
  position?: ToastPosition;
  /** Whether to show the countdown animation bar at the bottom (default: true) */
  showProgress?: boolean;
  /** Optional custom CSS classes */
  className?: string;
  /** Optional inline styles */
  style?: React.CSSProperties;
  /** Optional auxiliary action node (e.g. undo button) */
  action?: React.ReactNode;
}

const SEVERITY_CONFIG: Record<
  ToastSeverity,
  {
    borderColor: string;
    glowColor: string;
    badgeBg: string;
    badgeBorder: string;
    iconColor: string;
    progressColor: string;
    pulseColor: string;
    Icon: React.FC<{ style?: React.CSSProperties; className?: string; size?: number }>;
    defaultTitle: string;
  }
> = {
  success: {
    borderColor: '#10B981',
    glowColor: 'rgba(16, 185, 129, 0.25)',
    badgeBg: '#064E3B',
    badgeBorder: '#10B981',
    iconColor: '#34D399',
    progressColor: '#10B981',
    pulseColor: 'rgba(16, 185, 129, 0.4)',
    Icon: CheckCircle2,
    defaultTitle: 'Success',
  },
  info: {
    borderColor: '#3B82F6',
    glowColor: 'rgba(59, 130, 246, 0.25)',
    badgeBg: '#1E3A8A',
    badgeBorder: '#3B82F6',
    iconColor: '#60A5FA',
    progressColor: '#3B82F6',
    pulseColor: 'rgba(59, 130, 246, 0.4)',
    Icon: Info,
    defaultTitle: 'Notice',
  },
  warning: {
    borderColor: '#F59E0B',
    glowColor: 'rgba(245, 158, 11, 0.25)',
    badgeBg: '#78350F',
    badgeBorder: '#F59E0B',
    iconColor: '#FBBF24',
    progressColor: '#F59E0B',
    pulseColor: 'rgba(245, 158, 11, 0.4)',
    Icon: AlertTriangle,
    defaultTitle: 'Warning',
  },
  error: {
    borderColor: '#EF4444',
    glowColor: 'rgba(239, 68, 68, 0.25)',
    badgeBg: '#7F1D1D',
    badgeBorder: '#EF4444',
    iconColor: '#F87171',
    progressColor: '#EF4444',
    pulseColor: 'rgba(239, 68, 68, 0.4)',
    Icon: AlertCircle,
    defaultTitle: 'Error',
  },
};

const getPositionStyles = (pos: ToastPosition): React.CSSProperties => {
  switch (pos) {
    case 'top-right':
      return {
        // Positioned in top-right corner, directly underneath the sticky J&J header + ribbon
        top: 'calc(var(--header-height, 3.625rem) + var(--ribbon-height, 13px) + 12px)',
        right: 'var(--space-page-padding-x, 24px)',
      };
    case 'top-left':
      return {
        top: 'calc(var(--header-height, 3.625rem) + var(--ribbon-height, 13px) + 12px)',
        left: 'var(--space-page-padding-x, 24px)',
      };
    case 'top-center':
      return {
        top: 'calc(var(--header-height, 3.625rem) + var(--ribbon-height, 13px) + 12px)',
        left: '50%',
        transform: 'translateX(-50%)',
      };
    case 'bottom-right':
      return {
        bottom: '24px',
        right: 'var(--space-page-padding-x, 24px)',
      };
    case 'bottom-left':
      return {
        bottom: '24px',
        left: 'var(--space-page-padding-x, 24px)',
      };
    case 'bottom-center':
      return {
        bottom: '24px',
        left: '50%',
        transform: 'translateX(-50%)',
      };
    default:
      return {
        top: 'calc(var(--header-height, 3.625rem) + var(--ribbon-height, 13px) + 12px)',
        right: 'var(--space-page-padding-x, 24px)',
      };
  }
};

/**
 * Standardized Enterprise SharedToast Notification.
 * Harmonized with the J&J brand theme and Backup_JNJ_IAR enterprise notification standard.
 * Anchors in the top-right corner underneath the global header by default.
 */
export const SharedToast: React.FC<SharedToastProps> = ({
  open,
  onClose,
  title,
  description,
  message,
  severity,
  variant,
  duration = 4500,
  position = 'top-right',
  showProgress = true,
  className = '',
  style,
  action,
}) => {
  const activeSeverity: ToastSeverity = severity || variant || 'success';
  const config = SEVERITY_CONFIG[activeSeverity] || SEVERITY_CONFIG.success;
  const IconComponent = config.Icon;

  // Auto-dismiss effect
  useEffect(() => {
    if (!open || duration <= 0) return;
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [open, duration, onClose]);

  if (!open) return null;

  const displayTitle = title || (!description && message ? config.defaultTitle : title);
  const displayDesc = description || message || '';

  const isTopPosition = position.startsWith('top');

  return (
    <div
      role="status"
      aria-live="polite"
      className={`shared-toast-container ${className}`}
      style={{
        position: 'fixed',
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        minWidth: '360px',
        maxWidth: '450px',
        backgroundColor: '#0F172A',
        color: '#FFFFFF',
        borderRadius: '10px',
        border: `1px solid ${config.borderColor}`,
        boxShadow: `0 14px 36px rgba(15, 23, 42, 0.45), 0 0 24px ${config.glowColor}`,
        animation: isTopPosition
          ? 'slideDownToast 0.28s cubic-bezier(0.16, 1, 0.3, 1)'
          : 'slideUpToast 0.28s cubic-bezier(0.16, 1, 0.3, 1)',
        overflow: 'hidden',
        boxSizing: 'border-box',
        ...getPositionStyles(position),
        ...style,
      }}
    >
      {/* Toast Content Row */}
      <div
        style={{
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'flex-start',
          gap: '12px',
        }}
      >
        {/* Pulsing Status Icon Badge */}
        <div
          style={{
            width: '32px',
            height: '32px',
            borderRadius: '50%',
            backgroundColor: config.badgeBg,
            border: `1.5px solid ${config.badgeBorder}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            animation: 'toastPulse 2s infinite',
          }}
        >
          <IconComponent size={18} style={{ color: config.iconColor }} />
        </div>

        {/* Text Container: Title & Description */}
        <div style={{ flex: 1, minWidth: 0 }}>
          {displayTitle && (
            <h4
              style={{
                fontSize: '13.5px',
                fontWeight: 800,
                margin: 0,
                color: '#FFFFFF',
                letterSpacing: '0.2px',
                lineHeight: 1.3,
                fontFamily: 'var(--type-font-family, "jj-circular", Arial, sans-serif)',
              }}
            >
              {displayTitle}
            </h4>
          )}
          {displayDesc && (
            <p
              style={{
                fontSize: '12px',
                margin: displayTitle ? '4px 0 0 0' : 0,
                color: '#94A3B8',
                lineHeight: 1.45,
                fontFamily: 'var(--type-font-family, "jj-circular", Arial, sans-serif)',
              }}
            >
              {displayDesc}
            </p>
          )}
        </div>

        {/* Optional Action Slot */}
        {action && (
          <div style={{ flexShrink: 0 }}>
            {action}
          </div>
        )}

        {/* Close / Dismiss Button */}
        <button
          type="button"
          onClick={onClose}
          title="Dismiss notification"
          aria-label="Dismiss notification"
          style={{
            background: 'none',
            border: 'none',
            color: '#94A3B8',
            cursor: 'pointer',
            padding: '3px',
            borderRadius: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'all 0.15s ease',
            flexShrink: 0,
            lineHeight: 1,
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#FFFFFF';
            e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#94A3B8';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <X size={16} />
        </button>
      </div>

      {/* Countdown Progress Bar */}
      {showProgress && duration > 0 && (
        <div
          style={{
            width: '100%',
            height: '3px',
            backgroundColor: '#1E293B',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '100%',
              backgroundColor: config.progressColor,
              animation: `toastProgress ${duration}ms linear forwards`,
            }}
          />
        </div>
      )}
    </div>
  );
};
