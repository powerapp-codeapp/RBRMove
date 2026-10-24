import React from 'react';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Box from '@mui/material/Box';

export interface SharedTabItem<T = string> {
  id: T;
  label: string;
  count?: number | string;
  icon?: React.ReactElement;
  disabled?: boolean;
}

export interface SharedTabsProps<T = string> {
  items: SharedTabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  variant?: 'primary' | 'workbench' | 'pills';
  size?: 'small' | 'medium';
  ariaLabel?: string;
  rightAction?: React.ReactNode;
  /** Whether to render the horizontal baseline divider under the tabs. Default: true */
  hasBottomBorder?: boolean;
  /** Border color of the horizontal baseline. Default: #d8d8d8 */
  borderColor?: string;
  /** Border width / thickness of the horizontal baseline. Default: 1px */
  borderWidth?: string | number;
  /** Selected tab text & indicator color. Default: #000099 (Primary Blue) */
  activeColor?: string;
  /** Optional bottom margin override. Defaults to 0px for workbench, 14px for primary */
  marginBottom?: string | number;
  /** Gap between individual tab items. Defaults to 28px for workbench, 8px for primary */
  tabGap?: string | number;
  /** Optional SxProps for custom root styling */
  sx?: any;
}

export const SharedTabs = <T extends string = string>({
  items,
  value,
  onChange,
  variant = 'primary',
  size = 'medium',
  ariaLabel = 'Navigation tabs',
  rightAction,
  hasBottomBorder = true,
  borderColor = '#d8d8d8',
  borderWidth = '1px',
  activeColor = '#000099',
  marginBottom,
  tabGap,
  sx = {}
}: SharedTabsProps<T>): React.ReactElement => {
  const handleChange = (_event: React.SyntheticEvent, newValue: T) => {
    onChange(newValue);
  };

  const isWorkbench = variant === 'workbench';
  const resolvedBorderWidth = typeof borderWidth === 'number' ? `${borderWidth}px` : borderWidth;
  const resolvedMarginBottom =
    marginBottom !== undefined
      ? typeof marginBottom === 'number'
        ? `${marginBottom}px`
        : marginBottom
      : isWorkbench
      ? '0px'
      : '14px';
  const resolvedTabGap =
    tabGap !== undefined
      ? typeof tabGap === 'number'
        ? `${tabGap}px`
        : tabGap
      : isWorkbench
      ? '28px'
      : '8px';

  return (
    <Box
      sx={{
        width: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '24px',
        borderBottom: hasBottomBorder ? `${resolvedBorderWidth} solid ${borderColor}` : 'none',
        marginBottom: resolvedMarginBottom,
        paddingLeft: isWorkbench ? '38px' : '0px',
        ...sx
      }}
    >
      <Tabs
        value={value}
        onChange={handleChange}
        aria-label={ariaLabel}
        variant="scrollable"
        scrollButtons="auto"
        allowScrollButtonsMobile
        sx={{
          minHeight: size === 'small' ? '32px' : '36px',
          '& .MuiTabs-indicator': {
            backgroundColor: activeColor,
            height: '3px',
            borderRadius: '2px 2px 0 0',
            transition: 'all 0.2s ease-in-out',
            bottom: 0
          },
          '& .MuiTabs-flexContainer': {
            gap: resolvedTabGap,
            alignItems: 'center'
          }
        }}
      >
        {items.map((item) => {
          const isSelected = item.id === value;

          return (
            <Tab
              key={item.id}
              value={item.id}
              disabled={item.disabled}
              disableRipple
              label={
                <Box
                  component="span"
                  sx={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px'
                  }}
                >
                  {item.icon && (
                    <Box
                      component="span"
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        color: isSelected ? activeColor : '#64748B'
                      }}
                    >
                      {item.icon}
                    </Box>
                  )}
                  <span>{item.label}</span>
                  {item.count !== undefined && (
                    <Box
                      component="span"
                      sx={{
                        fontSize: isWorkbench ? '10.5px' : 'var(--type-badge-size, 11px)',
                        fontWeight: 'var(--type-badge-weight, 700)',
                        padding: isWorkbench ? '1px 6px' : '2px 8px',
                        borderRadius: isWorkbench ? '10px' : '12px',
                        backgroundColor: isSelected
                          ? (isWorkbench ? '#EFF6FF' : activeColor)
                          : (isWorkbench ? '#F1F5F9' : '#E2E8F0'),
                        color: isSelected
                          ? (isWorkbench ? activeColor : '#ffffff')
                          : '#475569',
                        transition: 'all 0.15s ease'
                      }}
                    >
                      {item.count}
                    </Box>
                  )}
                </Box>
              }
              sx={{
                minHeight: size === 'small' ? '32px' : '36px',
                minWidth: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: isWorkbench
                  ? '6px 4px 8px 4px'
                  : (size === 'small'
                    ? '4px 10px 6px 10px'
                    : '6px clamp(10px, 0.8vw, 16px) 8px clamp(10px, 0.8vw, 16px)'),
                fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
                fontSize: isWorkbench
                  ? 'var(--type-table-header-size, 12px)'
                  : (size === 'small' ? 'var(--type-table-row-size, 12.5px)' : 'var(--type-studio-title-size, 14.5px)'),
                fontWeight: isSelected
                  ? 'var(--type-weight-semibold, 600)'
                  : 'var(--type-weight-medium, 500)',
                lineHeight: 'var(--type-studio-title-leading, 1.3)',
                textTransform: isWorkbench ? 'uppercase' : 'none',
                color: isSelected ? activeColor : '#64748B',
                transition: 'color 0.15s ease',
                '&.Mui-selected': {
                  color: activeColor,
                  fontWeight: 'var(--type-weight-semibold, 600)'
                },
                '&:hover': {
                  color: activeColor,
                  opacity: 0.95
                },
                '&.Mui-disabled': {
                  opacity: 0.4
                }
              }}
            />
          );
        })}
      </Tabs>

      {rightAction && (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          {rightAction}
        </Box>
      )}
    </Box>
  );
};
