import React, { useId } from 'react';
import Select from '@mui/material/Select';
import type { SelectChangeEvent } from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { SharedFieldLabel } from '../common/SharedFieldLabel';
import { SharedFieldError } from '../common/SharedFieldError';

export interface RecipientSelectOption {
  id: string;
  name: string;
  displayName?: string;
  email?: string;
  roleName?: string;
  roleAbbr?: string;
  targetStatus?: string;
  isCurrent?: boolean;
  disabled?: boolean;
}

export interface SharedRecipientSelectProps {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: RecipientSelectOption[];
  placeholder?: string;
  required?: boolean;
  error?: boolean;
  errorMessage?: string;
  helperText?: string;
  disabled?: boolean;
  fullWidth?: boolean;
  id?: string;
  className?: string;
}

/**
 * Reusable Rich Recipient Select Dropdown Component
 * Displays Name, Email, Role pill, and Target Review Stage + Stage pill
 * in both the selected trigger and the dropdown list options.
 */
export const SharedRecipientSelect: React.FC<SharedRecipientSelectProps> = ({
  label = 'Assigned To',
  value,
  onChange,
  options,
  placeholder = 'Select team member...',
  required = false,
  error = false,
  errorMessage,
  helperText,
  disabled = false,
  fullWidth = true,
  id: externalId,
  className = '',
}) => {
  const generatedId = useId();
  const selectId = externalId || `recipient-select-${generatedId}`;
  const helperId = `${selectId}-helper`;

  const handleChange = (event: SelectChangeEvent<string>) => {
    onChange(event.target.value);
  };

  const renderRecipientContent = (opt: RecipientSelectOption) => (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '10px',
        width: '100%',
      }}
    >
      {/* Left: User Name */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
        <span
          style={{
            fontSize: 'var(--type-input-text-size, 12.5px)',
            fontWeight: 400,
            color: '#1E293B',
            lineHeight: 1.35,
            fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {opt.displayName || opt.name}
        </span>
      </div>

      {/* Right: Role Pill (white background, dark slate text, grey border) */}
      <span
        style={{
          fontSize: '11px',
          fontWeight: 600,
          padding: '2px 8px',
          borderRadius: '4px',
          backgroundColor: '#FFFFFF',
          color: '#334155',
          border: '1px solid #E2E8F0',
          lineHeight: 1.2,
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {opt.roleName || opt.roleAbbr || 'Auditor'}
      </span>
    </div>
  );

  return (
    <div className={`${fullWidth ? 'w-full' : 'inline-block'} ${className}`}>
      {label && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
          <SharedFieldLabel
            htmlFor={selectId}
            label={label}
            required={required}
            error={error}
            disabled={disabled}
            style={{ marginBottom: 0 }}
          />
        </div>
      )}

      <div
        className="type-input-value relative flex items-center rounded border transition-all duration-150 bg-white hover:border-slate-400 focus-within:border-blue-600 focus-within:ring-2 focus-within:ring-blue-100"
        style={{
          backgroundColor: disabled ? '#FAFAFA' : '#FFFFFF',
          borderColor: error ? '#ef4444' : '#CBD5E1',
          fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
        }}
      >
        <Select<string>
          id={selectId}
          value={value || ''}
          onChange={handleChange}
          disabled={disabled}
          displayEmpty
          fullWidth
          IconComponent={(iconProps) => (
            <KeyboardArrowDownIcon
              {...iconProps}
              className={`text-slate-500 mr-2 transition-transform duration-150 !w-4 !h-4 ${iconProps.className || ''}`}
            />
          )}
          renderValue={(selectedVal) => {
            if (!selectedVal) {
              return (
                <span
                  style={{
                    color: '#94A3B8',
                    fontWeight: 300,
                    fontSize: 'var(--type-input-text-size, 12.5px)',
                    fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
                  }}
                >
                  {placeholder}
                </span>
              );
            }
            const match = options.find((opt) => opt.id === selectedVal);
            if (!match) {
              return (
                <span style={{ color: '#1E293B', fontSize: 'var(--type-input-text-size, 12.5px)' }}>
                  {selectedVal}
                </span>
              );
            }
            return renderRecipientContent(match);
          }}
          inputProps={{
            'aria-invalid': error,
            'aria-describedby': errorMessage || helperText ? helperId : undefined,
            'aria-required': required,
            id: selectId,
          }}
          sx={{
            width: '100%',
            outline: 'none',
            fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
            '& .MuiSelect-select': {
              paddingLeft: '12px',
              paddingRight: '34px !important',
              paddingTop: '8px',
              paddingBottom: '8px',
              display: 'flex',
              alignItems: 'center',
              cursor: disabled ? 'default' : 'pointer',
              whiteSpace: 'normal !important',
            },
            '& fieldset': { border: 'none' },
            '&:hover fieldset': { border: 'none' },
            '&.Mui-focused fieldset': { border: 'none' },
          }}
          MenuProps={{
            sx: {
              zIndex: 10010,
            },
            slotProps: {
              paper: {
                className: 'mt-1 rounded-md border border-slate-200 shadow-lg overflow-hidden py-1 max-h-72 no-scrollbar',
                sx: {
                  '& .MuiMenuItem-root': {
                    paddingY: '8px',
                    paddingX: '12px',
                    borderBottom: '1px solid #F1F5F9',
                    '&:last-of-type': {
                      borderBottom: 'none',
                    },
                    '&.Mui-selected': {
                      backgroundColor: '#F8FAFF',
                      '&:hover': {
                        backgroundColor: '#EFF6FF',
                      },
                    },
                    '&:hover': {
                      backgroundColor: '#F8FAFC',
                    },
                  },
                },
              },
            },
          }}
        >
          {options.map((opt) => (
            <MenuItem
              key={opt.id}
              value={opt.id}
              disabled={Boolean(opt.isCurrent || opt.disabled)}
              style={{
                opacity: opt.isCurrent ? 0.55 : 1,
              }}
            >
              {renderRecipientContent(opt)}
            </MenuItem>
          ))}
        </Select>
      </div>

      <SharedFieldError
        id={helperId}
        error={error}
        errorMessage={errorMessage}
        helperText={helperText}
      />
    </div>
  );
};

export default SharedRecipientSelect;

