import React, { useState, useRef } from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import { ChevronDown, Send, CheckCircle2, MessageSquare } from 'lucide-react';
import CircularProgress from '@mui/material/CircularProgress';

export interface WorkflowSubmitButtonProps {
  label: string;
  onClickDirect: () => void;
  onOpenRemarks: () => void;
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
  variant = 'primary',
  size = 'small',
  disabled = false,
  loading = false,
  startIcon,
  title,
  style,
}) => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isOpen = Boolean(anchorEl);

  const handleOpenMenu = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!disabled && !loading) {
      setAnchorEl(e.currentTarget);
    }
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleDirectClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    if (!disabled && !loading) {
      onClickDirect();
    }
  };

  const handleItemClickDirect = () => {
    handleCloseMenu();
    onClickDirect();
  };

  const handleItemClickWithRemarks = () => {
    handleCloseMenu();
    onOpenRemarks();
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
    <div
      ref={containerRef}
      title={title}
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
      {/* Primary Action Button */}
      <button
        type="button"
        disabled={disabled || loading}
        onClick={handleDirectClick}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          minHeight,
          padding: '0 10px',
          backgroundColor: bgColor,
          borderColor,
          borderStyle: 'solid',
          borderWidth: '1px 0 1px 1px',
          borderRadius: '4px 0 0 4px',
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

      {/* Split Dropdown Trigger */}
      <button
        type="button"
        disabled={disabled || loading}
        onClick={handleOpenMenu}
        aria-haspopup="true"
        aria-expanded={isOpen}
        aria-label={`${label} options`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight,
          padding: '0 6px',
          backgroundColor: bgColor,
          borderColor,
          borderStyle: 'solid',
          borderWidth: '1px 1px 1px 1px',
          borderLeft: '1px solid rgba(255, 255, 255, 0.25)',
          borderRadius: '0 4px 4px 0',
          color: '#FFFFFF',
          cursor: disabled || loading ? 'not-allowed' : 'pointer',
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
        <ChevronDown size={14} />
      </button>

      {/* Dropdown Menu */}
      <Menu
        anchorEl={anchorEl}
        open={isOpen}
        onClose={handleCloseMenu}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        slotProps={{
          paper: {
            sx: {
              mt: '4px',
              minWidth: '220px',
              boxShadow: '0 4px 16px rgba(0, 0, 0, 0.12)',
              borderRadius: '6px',
              border: '1px solid #E2E8F0',
            },
          },
        }}
      >
        <MenuItem
          onClick={handleItemClickDirect}
          style={{
            fontSize: '12px',
            fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
            color: '#1E293B',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
          }}
        >
          {effectiveIcon}
          <span>{label} (Direct Submit)</span>
        </MenuItem>
        <MenuItem
          onClick={handleItemClickWithRemarks}
          style={{
            fontSize: '12px',
            fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
            color: '#1E293B',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '8px 12px',
          }}
        >
          <MessageSquare size={13} style={{ color: '#000099' }} />
          <span>{label} with Remarks...</span>
        </MenuItem>
      </Menu>
    </div>
  );
};
