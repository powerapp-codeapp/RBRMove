import React from 'react';

export interface SharedFieldLabelProps {
  label?: string;
  required?: boolean;
  error?: boolean;
  disabled?: boolean;
  htmlFor?: string;
  id?: string;
  className?: string;
  children?: React.ReactNode;
  style?: React.CSSProperties;
}

/**
 * Reusable field label component for enterprise forms.
 * Enforces uppercase, compact typography with consistent red required asterisk.
 */
export const SharedFieldLabel: React.FC<SharedFieldLabelProps> = ({
  label,
  required = false,
  error = false,
  disabled = false,
  htmlFor,
  id,
  className = '',
  children,
  style,
}) => {
  if (!label && !children) return null;

  const colorClass = error
    ? 'text-red-600'
    : disabled
    ? 'text-slate-400'
    : 'text-slate-700';

  return (
    <label
      id={id}
      htmlFor={htmlFor}
      className={`type-field-label block text-[11px] font-semibold uppercase tracking-wider mb-1 transition-colors select-none ${colorClass} ${className}`}
      style={{
        display: 'block',
        fontSize: 'var(--type-field-label-size, 11.5px)',
        fontWeight: 'var(--type-field-label-weight, 600)' as any,
        lineHeight: 'var(--type-field-label-leading, 1.35)' as any,
        textTransform: 'uppercase',
        letterSpacing: '0.04em',
        marginBottom: '5px',
        color: error ? '#dc2626' : 'var(--type-field-label-color, #475569)',
        fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
        userSelect: 'none',
        ...style
      }}
    >
      {label || children}
      {required && (
        <span
          style={{
            color: 'var(--jj-red, #eb1700)',
            fontWeight: 700,
            marginLeft: '2px',
            fontSize: 'var(--type-field-label-size, 12px)',
            display: 'inline-block'
          }}
          aria-hidden="true"
        >
          *
        </span>
      )}
    </label>
  );
};

export default SharedFieldLabel;
