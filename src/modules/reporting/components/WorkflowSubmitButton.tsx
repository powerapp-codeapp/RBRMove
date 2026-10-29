import React from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import CircularProgress from '@mui/material/CircularProgress';
import { SharedTooltip } from '../../../components/shared/feedback/SharedTooltip';

export interface WorkflowSubmitButtonProps {
  label: string;
  onClickDirect: () => void;
  onOpenRemarks: () => void;
  directOnly?: boolean;
  variant?: 'primary' | 'success' | 'secondary' | 'outline';
  size?: 'small' | 'medium';
  disabled?: boolean;
  loading?: boolean;
  startIcon?: React.ReactNode;
  title?: string;
  style?: React.CSSProperties;
}

export const WorkflowSubmitButton: React.FC<WorkflowSubmitButtonProps> = ({
  label,
  onClickDirect,
  onOpenRemarks,
  directOnly = false,
  variant = 'primary',
  size = 'small',
  disabled = false,
  loading = false,
  startIcon,
  title,
  style,
}) => {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!disabled && !loading) {
      if (directOnly) {
        onClickDirect();
      } else {
        onOpenRemarks();
      }
    }
  };

  // Color schemes
  const isSuccess = variant === 'success';
  const isSecondary = variant === 'secondary' || variant === 'outline';

  const bgColor = disabled
    ? '#94A3B8'
    : isSuccess
      ? '#059669'
      : isSecondary
        ? '#475569'
        : '#000099';

  const hoverBgColor = disabled
    ? '#94A3B8'
    : isSuccess
      ? '#047857'
      : isSecondary
        ? '#334155'
        : '#000080';

  const borderColor = disabled
    ? '#94A3B8'
    : isSuccess
      ? '#059669'
      : isSecondary
        ? '#475569'
        : '#000099';

  const defaultIcon = isSuccess ? <CheckCircle2 size={12} /> : <Send size={12} />;
  const effectiveIcon = startIcon !== undefined ? startIcon : defaultIcon;

  const minHeight = size === 'small' ? '28px' : '34px';
  const fontSize = size === 'small' ? '12px' : '13px';

  return (
    <SharedTooltip title={title || ''} placement="top" arrow>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'stretch',
          borderRadius: '4px',
          boxShadow: disabled ? 'none' : '0 1px 2px rgba(0,0,0,0.06)',
          opacity: disabled ? 0.65 : 1,
          cursor: disabled ? 'not-allowed' : 'pointer',
          ...style,
        }}
      >
        <button
          type="button"
          disabled={disabled || loading}
          onClick={handleClick}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            minHeight,
            padding: '0 12px',
            backgroundColor: bgColor,
            borderColor,
            borderStyle: 'solid',
            borderWidth: '1px',
            borderRadius: '4px',
            color: '#FFFFFF',
            fontSize,
            fontWeight: 600,
            fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
            cursor: disabled || loading ? 'not-allowed' : 'pointer',
            whiteSpace: 'nowrap',
            transition: 'background-color 150ms ease-in-out',
          }}
          onMouseEnter={(e) => {
            if (!disabled && !loading) {
              e.currentTarget.style.backgroundColor = hoverBgColor;
            }
          }}
          onMouseLeave={(e) => {
            if (!disabled && !loading) {
              e.currentTarget.style.backgroundColor = bgColor;
            }
          }}
        >
          {loading ? (
            <CircularProgress size={12} style={{ color: '#FFFFFF' }} />
          ) : (
            effectiveIcon
          )}
          <span>{label}</span>
        </button>
      </div>
    </SharedTooltip>
  );
};
