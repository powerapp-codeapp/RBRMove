import React, { useState } from 'react';
import type { Issue } from '../../../types/dataverse.types';
import { useUserSession } from '../../../context/UserSessionContext';
import {
  GripHorizontal,
  ArrowUp,
  ArrowDown,
  Lock,
  Eye,
  Ban,
  User,
} from 'lucide-react';

export interface IssueNavCardProps {
  issue: Issue;
  index: number;
  isSelected: boolean;
  isReadOnly?: boolean;
  readOnlyReason?: string;
  isFirst?: boolean;
  isLast?: boolean;
  isDragging?: boolean;
  isOver?: boolean;
  draggable?: boolean;
  onSelect: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  onInclude?: () => void;
  onDragStart?: (e: React.DragEvent) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDragLeave?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent) => void;
  onDragEnd?: () => void;
  onDragHandleMouseEnter?: () => void;
  onDragHandleMouseLeave?: () => void;
  onDragHandleMouseDown?: (e: React.MouseEvent) => void;
}

/**
 * Standardized Issue Navigator Card
 * 3-Row layout:
 * - Row 1: Left: Drag handle (3x2 grip), Ref # & Function badge (IT/FinOps); Right: Locked pill & Criticality
 * - Row 2: Issue title
 * - Row 3: Left: Assigned user name; Right: Up/Down reordering icons & Status badge
 */
export const IssueNavCard: React.FC<IssueNavCardProps> = ({
  issue,
  index,
  isSelected,
  isReadOnly = false,
  readOnlyReason,
  isFirst = false,
  isLast = false,
  isDragging = false,
  isOver = false,
  draggable = false,
  onSelect,
  onMoveUp,
  onMoveDown,
  onInclude: _onInclude,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  onDragHandleMouseEnter,
  onDragHandleMouseLeave,
  onDragHandleMouseDown,
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const { activeRole } = useUserSession();

  const isLocked = !!issue.isLocked;
  const isExcluded = !!issue.isExcluded;

  // Determine function (IT vs FinOps)
  const isIT = (() => {
    const fn = (issue.function || (issue as any).functionType || '').toUpperCase();
    if (fn.includes('FINOPS') || fn.includes('FIN')) return false;
    if (fn.includes('IT')) return true;
    const testProc = (issue.testProcedureCode || (issue as any).testProcedure || '').toUpperCase();
    const acct = (issue.accountableFunction || '').toUpperCase();
    if (acct.includes('FINOPS') || acct.includes('FINANCE')) return false;
    if (acct.includes('IT')) return true;
    return testProc.includes('TP-101') || testProc.includes('TP-102') || testProc.includes('TP-110');
  })();

  const roleStr = (activeRole?.id || '').toLowerCase();
  const isITUser = roleStr.includes('it');
  const isFinOpsUser = roleStr.includes('finops') || roleStr.includes('fin');
  const isVP = roleStr.includes('vp') || roleStr.includes('head');

  const computedReadOnly = !isVP && ((isITUser && !isIT) || (isFinOpsUser && isIT));
  const effectiveReadOnly = isReadOnly !== undefined ? isReadOnly : computedReadOnly;

  const functionLabel = isIT ? 'IT' : 'FinOps';
  const ownerName =
    issue.currentOwner ||
    (issue as any).owner ||
    issue.primaryBusinessOwnerName ||
    issue.accountableContact ||
    issue.businessContactName ||
    (issue as any).leadAuditor ||
    'Unassigned';

  // Helper to format issue title so it is not in all capital letters
  const formatCardTitle = (rawTitle: string): string => {
    if (!rawTitle) return '';
    const hasLetters = /[a-zA-Z]/.test(rawTitle);
    if (hasLetters && rawTitle === rawTitle.toUpperCase()) {
      return rawTitle.charAt(0).toUpperCase() + rawTitle.slice(1).toLowerCase();
    }
    return rawTitle;
  };

  // Render Criticality Badge directly from the Dataverse table value as-is
  const renderCriticalityBadge = (crit?: string) => {
    const cleanCrit = (crit || '').trim();
    if (!cleanCrit) return null;

    const cLower = cleanCrit.toLowerCase();
    let bg = '#000099';
    if (cLower === 'critical' || cLower === 'high') bg = '#D8001D';
    else if (cLower === 'major' || cLower === 'medium') bg = '#EA580C';
    else if (cLower === 'minor' || cLower === 'low') bg = '#16A34A';

    return (
      <span
        className="type-badge"
        style={{
          fontSize: 'var(--type-badge-size, 11px)',
          fontWeight: 600,
          fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
          color: '#ffffff',
          backgroundColor: bg,
          padding: '2px 7px',
          borderRadius: '4px',
          whiteSpace: 'nowrap',
          lineHeight: 'var(--type-badge-leading, 1.2)',
          flexShrink: 0,
          WebkitFontSmoothing: 'antialiased',
          MozOsxFontSmoothing: 'grayscale',
        }}
      >
        {cleanCrit}
      </span>
    );
  };

  // Render Status Badge - light blue background pill irrespective of any status
  const renderStatusBadge = (status: string) => {
    return (
      <span
        className="type-badge"
        style={{
          fontSize: 'var(--type-badge-size, 11px)',
          fontWeight: 600,
          fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
          padding: '2px 8px',
          borderRadius: '4px',
          backgroundColor: '#EFF6FF',
          color: '#000099',
          border: '1px solid #BFDBFE',
          whiteSpace: 'nowrap',
          lineHeight: 'var(--type-badge-leading, 1.2)',
          boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
        }}
      >
        {status}
      </span>
    );
  };

  // Border & shadow properties
  const resolveBorder = () => {
    if (isOver) return '2px dashed #2563EB';
    if (isSelected) return '1px solid #CBD5E1';
    if (isHovered) return '1px solid #000099';
    return '1px solid #E2E8F0';
  };

  const resolveBoxShadow = () => {
    if (isOver) return '0 4px 12px rgba(37, 99, 235, 0.2)';
    if (isSelected) return '0 2px 8px rgba(0, 0, 0, 0.08)';
    if (isHovered) return '0 1px 3px rgba(0, 0, 153, 0.06)';
    return 'none';
  };

  const resolveBackground = () => {
    if (isOver) return '#EFF6FF';
    if (isSelected) return '#ffffff';
    return '#FFFFFf';
  };

  return (
    <div
      draggable={draggable}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onDragEnd={onDragEnd}
      onClick={onSelect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        padding: '10px 12px',
        borderRadius: '6px',
        backgroundColor: resolveBackground(),
        border: resolveBorder(),
        boxShadow: resolveBoxShadow(),
        cursor: draggable ? (isDragging ? 'grabbing' : 'grab') : 'pointer',
        opacity: isDragging ? 0.45 : isExcluded ? 0.72 : 1,
        transition: 'all 0.15s ease',
        position: 'relative',
        overflow: 'hidden',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        flexShrink: 0,
      }}
    >
      {/* Active Selection Indicator: Blue container on the left edge for full height */}
      {isSelected && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '4px',
            backgroundColor: '#000099',
            borderRadius: '6px 0 0 6px',
          }}
        />
      )}

      {/* ========================================================================= */}
      {/* ROW 1: Left: Drag handle & Reorder arrows | Right: Ref, Func, Pill, Crit  */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          width: '100%',
        }}
      >
        {/* Left Side: Drag handle and Up/Down arrows */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <span
            title="Drag to reorder"
            onMouseEnter={onDragHandleMouseEnter}
            onMouseLeave={onDragHandleMouseLeave}
            onMouseDown={onDragHandleMouseDown}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#94A3B8',
              backgroundColor: '#ffffff',
              border: '1px solid #E2E8F0',
              borderRadius: '4px',
              cursor: isDragging ? 'grabbing' : 'grab',
              padding: '2px 5px',
              height: '20px',
              boxSizing: 'border-box',
              flexShrink: 0,
              transition: 'all 0.12s ease',
            }}
          >
            <GripHorizontal size={13} />
          </span>

          <div
            style={{ display: 'inline-flex', alignItems: 'center', gap: '2px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              title="Move issue up"
              aria-label="Move issue up"
              disabled={isFirst}
              onClick={(e) => {
                e.stopPropagation();
                onMoveUp?.();
              }}
              style={{
                border: '1px solid #E2E8F0',
                backgroundColor: isFirst ? 'transparent' : '#ffffff',
                padding: '2px',
                cursor: isFirst ? 'default' : 'pointer',
                color: isFirst ? '#CBD5E1' : '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '3px',
                width: '20px',
                height: '20px',
                minHeight: '20px',
                transition: 'all 0.12s ease',
              }}
              onMouseEnter={(e) => {
                if (!isFirst) {
                  e.currentTarget.style.borderColor = '#000099';
                  e.currentTarget.style.color = '#000099';
                }
              }}
              onMouseLeave={(e) => {
                if (!isFirst) {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.color = '#475569';
                }
              }}
            >
              <ArrowUp size={11} />
            </button>
            <button
              type="button"
              title="Move issue down"
              aria-label="Move issue down"
              disabled={isLast}
              onClick={(e) => {
                e.stopPropagation();
                onMoveDown?.();
              }}
              style={{
                border: '1px solid #E2E8F0',
                backgroundColor: isLast ? 'transparent' : '#ffffff',
                padding: '2px',
                cursor: isLast ? 'default' : 'pointer',
                color: isLast ? '#CBD5E1' : '#475569',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '3px',
                width: '20px',
                height: '20px',
                minHeight: '20px',
                transition: 'all 0.12s ease',
              }}
              onMouseEnter={(e) => {
                if (!isLast) {
                  e.currentTarget.style.borderColor = '#000099';
                  e.currentTarget.style.color = '#000099';
                }
              }}
              onMouseLeave={(e) => {
                if (!isLast) {
                  e.currentTarget.style.borderColor = '#E2E8F0';
                  e.currentTarget.style.color = '#475569';
                }
              }}
            >
              <ArrowDown size={11} />
            </button>
          </div>
        </div>

        {/* Right Side: Ref #, Function, Excluded/Read Only/Locked, Criticality */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          <span
            className="type-badge"
            style={{
              fontSize: 'var(--type-badge-size, 11px)',
              fontWeight: 600,
              fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
              color: '#334155',
              backgroundColor: '#ffffff',
              border: '1px solid #E2E8F0',
              padding: '2px 7px',
              borderRadius: '4px',
              whiteSpace: 'nowrap',
              lineHeight: 'var(--type-badge-leading, 1.2)',
              flexShrink: 0,
            }}
          >
            Ref #{issue.reportRef || (issue as any).reportReference || index + 1}
          </span>

          <span
            className="type-badge"
            style={{
              fontSize: 'var(--type-badge-size, 11px)',
              fontWeight: 600,
              fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
              padding: '2px 7px',
              borderRadius: '4px',
              backgroundColor: '#ffffff',
              color: '#334155',
              border: '1px solid #E2E8F0',
              whiteSpace: 'nowrap',
              lineHeight: 'var(--type-badge-leading, 1.2)',
              flexShrink: 0,
            }}
          >
            {functionLabel}
          </span>

          {isLocked && !isExcluded && (
            <span
              className="type-badge"
              style={{
                fontSize: 'var(--type-badge-size, 11px)',
                fontWeight: 600,
                fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
                padding: '2px 7px',
                borderRadius: '4px',
                backgroundColor: '#ffffff',
                color: '#334155',
                border: '1px solid #E2E8F0',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3.5px',
                whiteSpace: 'nowrap',
                lineHeight: 'var(--type-badge-leading, 1.2)',
                flexShrink: 0,
              }}
            >
              <span className="lock-icon-blink" style={{ display: 'inline-flex', alignItems: 'center', gap: '3.5px' }}>
                <Lock size={10.5} color="#334155" />
                <span>Locked</span>
              </span>
            </span>
          )}

          {!isLocked && effectiveReadOnly && !isExcluded && (
            <span
              className="type-badge"
              style={{
                fontSize: 'var(--type-badge-size, 11px)',
                fontWeight: 600,
                fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
                padding: '2px 7px',
                borderRadius: '4px',
                backgroundColor: '#ffffff',
                color: '#334155',
                border: '1px solid #E2E8F0',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3.5px',
                whiteSpace: 'nowrap',
                lineHeight: 'var(--type-badge-leading, 1.2)',
                flexShrink: 0,
              }}
              title={readOnlyReason || 'Read Only: Functional Domain Restriction'}
            >
              <Eye size={10.5} color="#334155" />
              <span>Read Only</span>
            </span>
          )}

          {isExcluded && (
            <span
              className="type-badge"
              style={{
                fontSize: 'var(--type-badge-size, 11px)',
                fontWeight: 600,
                fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
                padding: '2px 7px',
                borderRadius: '4px',
                backgroundColor: '#ffffff',
                color: '#64748B',
                border: '1px solid #CBD5E1',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3.5px',
                whiteSpace: 'nowrap',
                lineHeight: 'var(--type-badge-leading, 1.2)',
                flexShrink: 0,
              }}
            >
              <Ban size={10.5} color="#94A3B8" />
              Excluded
            </span>
          )}

          {renderCriticalityBadge(issue.criticality)}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* ROW 2: Issue Title                                                        */}
      {/* ========================================================================= */}
      <div>
        <h4
          className="type-table-row-title"
          style={{
            fontSize: 'var(--type-table-row-size, 13px)',
            fontWeight: 500,
            color: isExcluded ? '#64748B' : '#334155',
            textDecoration: isExcluded ? 'line-through' : 'none',
            lineHeight: '1.35',
            fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
            margin: 0,
            wordBreak: 'break-word',
            textTransform: 'none',
          }}
        >
          {formatCardTitle(issue.title)}
        </h4>
      </div>

      {/* ========================================================================= */}
      {/* ROW 3: Left: Name only | Right: Status only                                */}
      {/* ========================================================================= */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '8px',
          marginTop: '2px',
        }}
      >
        {/* Left Side: Assigned User Name */}
        <span
          className="type-caption"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            fontSize: 'var(--type-caption-size, 11px)',
            color: '#334155',
            fontWeight: 600,
            fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
            maxWidth: '180px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={`Owner: ${ownerName}`}
        >
          <User size={12} color="#64748B" style={{ flexShrink: 0 }} />
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {ownerName}
          </span>
        </span>

        {/* Right Side: Status badge only */}
        {renderStatusBadge(issue.status)}
      </div>
    </div>
  );
};

export const SharedIssueNavCard = IssueNavCard;
