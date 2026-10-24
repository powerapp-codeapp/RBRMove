import React, { useState, useRef, useEffect } from 'react';
import Popper from '@mui/material/Popper';
import { SharedTooltip } from '../feedback/SharedTooltip';

export interface UserTablePillProps {
  owners?: string[];
  queue?: string;
  className?: string;
  style?: React.CSSProperties;
}

interface UserPopoverItemProps {
  name: string;
  initials: string;
}

/**
 * Interactive User Popover Item styled identical to SharedSelectButton dropdown items:
 * - 14px "jj-circular" typography, 400 weight, #334155 color
 * - 6px 12px padding, 4px border radius, 8px gap
 * - #f1f5f9 hover background with #1E293B text color
 */
const UserPopoverItem: React.FC<UserPopoverItemProps> = ({ name, initials }) => {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        padding: '6px 12px',
        borderRadius: '4px',
        fontSize: '14px',
        fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
        fontWeight: 400,
        color: isHovered ? '#1E293B' : '#334155',
        backgroundColor: isHovered ? '#f1f5f9' : 'transparent',
        transition: 'background-color 0.12s ease, color 0.12s ease',
        cursor: 'default',
        userSelect: 'none',
        boxSizing: 'border-box',
      }}
    >
      <span
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: '#64748B',
          color: '#ffffff',
          fontSize: '9.5px',
          fontWeight: 400,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        {initials}
      </span>
      <span style={{ flex: 1, whiteSpace: 'nowrap' }}>{name}</span>
    </div>
  );
};

export const UserTablePill: React.FC<UserTablePillProps> = ({
  owners = [],
  queue,
  className = '',
  style
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
  const [isBadgeHovered, setIsBadgeHovered] = useState(false);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Clean up any lingering close timer on unmount
  useEffect(() => {
    return () => {
      if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    };
  }, []);

  if (!owners || owners.length === 0) {
    return <span style={{ fontSize: '12px', color: '#94A3B8' }}>—</span>;
  }

  if (queue === 'Closed') {
    return (
      <span style={{ fontSize: '11.5px', color: '#64748B', fontStyle: 'italic', fontWeight: 400 }}>
        Finalized (Archive)
      </span>
    );
  }

  const firstUser = owners[0];
  const remainingUsers = owners.slice(1);

  const getInitials = (name: string): string => {
    return (name || '')
      .split(' ')
      .filter(Boolean)
      .map((p) => p[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleBadgeMouseEnter = (e: React.MouseEvent<HTMLElement>) => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
    setIsBadgeHovered(true);
    setAnchorEl(e.currentTarget);
  };

  const handleBadgeMouseLeave = () => {
    setIsBadgeHovered(false);
    closeTimerRef.current = setTimeout(() => {
      setAnchorEl(null);
    }, 180);
  };

  const handlePopoverMouseEnter = () => {
    if (closeTimerRef.current) clearTimeout(closeTimerRef.current);
  };

  const handlePopoverMouseLeave = () => {
    setAnchorEl(null);
  };

  const isPopoverOpen = Boolean(anchorEl) && remainingUsers.length > 0;

  return (
    <div
      className={`user-table-pill-container ${className}`}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        position: 'relative',
        ...style
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* 1. Primary Full User Pill */}
      <SharedTooltip title={firstUser} placement="top">
        <div
          className="user-table-pill-primary"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '6px',
            padding: '2px 8px 2px 4px',
            borderRadius: '12px',
            fontSize: '11.5px',
            fontWeight: 400,
            lineHeight: 'normal',
            backgroundColor: '#F8FAFC',
            border: '1px solid #CBD5E1',
            color: '#212121',
            whiteSpace: 'nowrap',
            maxWidth: '160px',
            flexShrink: 0
          }}
        >
          <span
            style={{
              width: '18px',
              height: '18px',
              borderRadius: '50%',
              backgroundColor: '#64748B',
              color: '#ffffff',
              fontSize: '9px',
              fontWeight: 400,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0
            }}
          >
            {getInitials(firstUser)}
          </span>
          <span
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              color: '#212121',
              fontSize: '11.5px',
              fontWeight: 400,
              lineHeight: 'normal',
              display: 'inline-block',
              maxWidth: '120px'
            }}
          >
            {firstUser}
          </span>
        </div>
      </SharedTooltip>

      {/* 2. Remaining Users (+N) Badge with Hover Popover matching SharedSelectButton */}
      {remainingUsers.length > 0 && (
        <>
          <button
            type="button"
            className="user-table-pill-overflow-badge"
            aria-label={`${remainingUsers.length} more owners`}
            onMouseEnter={handleBadgeMouseEnter}
            onMouseLeave={handleBadgeMouseLeave}
            onClick={(e) => {
              e.stopPropagation();
              setAnchorEl(anchorEl ? null : e.currentTarget);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px 6px',
              borderRadius: '10px',
              fontSize: '10.5px',
              fontWeight: 700,
              backgroundColor: isBadgeHovered || isPopoverOpen ? '#F0F4FF' : '#F1F5F9',
              color: isBadgeHovered || isPopoverOpen ? '#000099' : '#475569',
              border: isBadgeHovered || isPopoverOpen ? '1px solid #000099' : '1px solid #CBD5E1',
              cursor: 'pointer',
              lineHeight: 1,
              userSelect: 'none',
              transition: 'all 0.15s ease',
              outline: 'none',
            }}
          >
            +{remainingUsers.length}
          </button>

          {/* Componentised Popover Menu with exact border, shadow, item text, and hover from SharedSelectButton */}
          <Popper
            open={isPopoverOpen}
            anchorEl={anchorEl}
            placement="bottom-start"
            style={{ zIndex: 9999 }}
            modifiers={[
              {
                name: 'offset',
                options: {
                  offset: [0, 4],
                },
              },
            ]}
          >
            <div
              className="user-table-pill-popover-menu"
              onMouseEnter={handlePopoverMouseEnter}
              onMouseLeave={handlePopoverMouseLeave}
              onClick={(e) => e.stopPropagation()}
              style={{
                minWidth: '220px',
                borderRadius: '6px',
                border: 'none',
                boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.12), 0 8px 10px -6px rgba(0, 0, 0, 0.08)',
                backgroundColor: '#FFFFFF',
                padding: '4px',
                overflow: 'hidden',
                fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
                boxSizing: 'border-box',
              }}
            >
              {/* Items List with SharedSelectButton typography and #f1f5f9 hover */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                {remainingUsers.map((name, i) => (
                  <UserPopoverItem
                    key={`${name}-${i}`}
                    name={name}
                    initials={getInitials(name)}
                  />
                ))}
              </div>
            </div>
          </Popper>
        </>
      )}
    </div>
  );
};

export default UserTablePill;
