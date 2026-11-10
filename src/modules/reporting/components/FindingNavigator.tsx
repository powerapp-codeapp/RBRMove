import React, { useState } from 'react';
import type { Issue } from '../../../types/dataverse.types';
import { PanelLeftOpen } from 'lucide-react';
import { IssueNavCard } from '../../../components/shared';
import type { ListBoxFilterOption } from '../../../components/shared';
import { FindingNavigatorHeader } from './FindingNavigatorHeader';
import { useFindingReorder } from '../hooks/useFindingReorder';
import { isITIssue } from '../utils/reportingWorkflowEngine';

export interface FindingNavigatorProps {
  issues: Issue[];
  selectedIssueId: string | null;
  onSelectIssue: (issueId: string | null) => void;
  onReorderIssues: (newIssues: Issue[], isCrossPriority?: boolean, fromCrit?: string, toCrit?: string) => void;
  onOpenCreateDialog: () => void;
  onIncludeIssue?: (issueId: string) => void;
  userRole?: string;
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
}

export const FindingNavigator: React.FC<FindingNavigatorProps> = ({
  issues,
  selectedIssueId,
  onSelectIssue,
  onReorderIssues,
  onOpenCreateDialog,
  onIncludeIssue,
  userRole,
  isCollapsed = false,
  onToggleCollapse,
}) => {
  const [filterDomain, setFilterDomain] = useState<'all' | 'IT' | 'FinOps'>('all');

  const itCount = issues.filter(isITIssue).length;
  const finOpsCount = issues.length - itCount;

  const filterOptions: ListBoxFilterOption<'all' | 'IT' | 'FinOps'>[] = [
    { value: 'all', label: 'All', count: issues.length },
    { value: 'IT', label: 'IT', count: itCount },
    { value: 'FinOps', label: 'FinOps', count: finOpsCount },
  ];

  // Sort issues by Ref # ascending with active issues first and excluded issues at the bottom
  const sortedIssues = [...issues].sort((a, b) => {
    const aEx = a.isExcluded || a.status === 'Excluded' ? 1 : 0;
    const bEx = b.isExcluded || b.status === 'Excluded' ? 1 : 0;
    if (aEx !== bEx) return aEx - bEx;
    const aRef = Number(a.reportRef || (a as any).reportReference || 9999);
    const bRef = Number(b.reportRef || (b as any).reportReference || 9999);
    return aRef - bRef;
  });

  // Filtered list (maintaining ascending Ref # order)
  const filteredIssues = sortedIssues.filter((issue) => {
    if (filterDomain === 'all') return true;
    const isIT = isITIssue(issue);
    if (filterDomain === 'IT') return isIT;
    return !isIT;
  });

  const {
    draggedIssueId,
    dragOverIssueId,
    draggableCardId,
    setDraggableCardId,
    handleMoveIssueById,
    handleDragStart,
    handleDragOver,
    handleDragLeave,
    handleDrop,
    handleDragEnd,
  } = useFindingReorder({
    sortedIssues,
    filteredIssues,
    onReorderIssues,
  });

  // Check editability restriction by role and review tier
  const checkIssueEditability = (item: Issue) => {
    const roleStr = (userRole || '').toLowerCase();
    if (roleStr.includes('vp') || roleStr.includes('head') || roleStr.includes('admin')) {
      return { canEdit: true, reason: null };
    }
    const isIT = isITIssue(item);
    const isITRole = roleStr.includes('it');
    const isFinOpsRole = roleStr.includes('finops') || roleStr.includes('fin');

    if (isITRole && !isIT) {
      return {
        canEdit: false,
        reason: 'As an IT reviewer, you can only modify IT findings. This finding belongs to FinOps.',
      };
    }
    if (isFinOpsRole && isIT) {
      return {
        canEdit: false,
        reason: 'As a FinOps reviewer, you can only modify FinOps findings. This finding belongs to IT.',
      };
    }

    // Check review tier progression: finding at higher tier than logged-in user is read-only
    const userTier = (() => {
      if (roleStr.includes('admin')) return 99;
      if (roleStr.includes('vp')) return 5;
      if (roleStr.includes('business')) return 4.5;
      if (roleStr.includes('director')) return 4;
      if (roleStr.includes('manager') || roleStr.includes('mgr')) return 3;
      if (roleStr.includes('coordinator') || roleStr.includes('tc')) return 2;
      return 1;
    })();

    const issueTier = (() => {
      const s = (item.status || '').trim().toLowerCase();
      if (s.includes('exclude')) return -1;
      if (s.includes('complete') || s.includes('signed off')) return 6;
      if (s.includes('vp')) return 5;
      if (s.includes('business')) return 4.5;
      if (s.includes('ready for director')) return 3.8;
      if (s.includes('director')) return 4;
      if (s.includes('manager completed') || s.includes('waiting for other')) return 3.5;
      if (s.includes('manager') || s.includes('mgr')) return 3;
      if (s.includes('tc') || s.includes('coordinator')) return 2;
      return 1;
    })();

    if (userTier < 99 && issueTier > userTier && issueTier > 0) {
      return {
        canEdit: false,
        reason: `Finding is in higher review tier (${item.status}). Non-editable until called back.`,
      };
    }

    return { canEdit: true, reason: null };
  };

  // If collapsed, render 36px rail
  if (isCollapsed) {
    return (
      <div
        style={{
          width: '36px',
          minWidth: '36px',
          backgroundColor: '#F4F6F8',
          borderRight: 'none',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '10px',
          gap: '16px',
          userSelect: 'none',
          flexShrink: 0,
          height: '100%',
        }}
      >
        <button
          type="button"
          onClick={() => onToggleCollapse?.(false)}
          title="Expand Issues List"
          aria-label="Expand Issues List"
          style={{
            background: 'none',
            border: 'none',
            padding: '4px',
            color: '#64748B',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            width: '28px',
            height: '28px',
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.color = '#000099';
            e.currentTarget.style.backgroundColor = '#E2E8F0';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.color = '#64748B';
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
        >
          <PanelLeftOpen style={{ width: '16px', height: '16px' }} />
        </button>
        <div
          className="type-caption"
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            fontSize: 'var(--type-caption-size, 11px)',
            fontWeight: 800,
            color: '#475569',
            letterSpacing: '1px',
            whiteSpace: 'nowrap',
          }}
        >
          ISSUES ({issues.length})
        </div>
      </div>
    );
  }

  return (
    <aside
      style={{
        width: '100%',
        height: '100%',
        minHeight: 0,
        backgroundColor: '#F4F6F8',
        borderRight: 'none',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Pane 1 Header Toolbar */}
      <FindingNavigatorHeader
        filterDomain={filterDomain}
        onChangeFilterDomain={setFilterDomain}
        filterOptions={filterOptions}
        onOpenCreateDialog={onOpenCreateDialog}
        onToggleCollapse={onToggleCollapse}
      />

      {/* Cards List */}
      <div
        className="no-scrollbar"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          padding: '6px 10px 10px 10px',
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          backgroundColor: '#F4F6F8',
        }}
      >
        {filteredIssues.length === 0 ? (
          <div style={{ padding: '36px 16px', textAlign: 'center', color: '#64748B' }}>
            <div className="type-section-title" style={{ fontSize: 'var(--type-section-title-size, 13px)', fontWeight: 800, color: '#1E293B' }}>
              No {filterDomain !== 'all' ? filterDomain : ''} Findings
            </div>
            <div className="type-caption" style={{ fontSize: 'var(--type-caption-size, 11.5px)', color: '#64748B', marginTop: '4px' }}>
              No findings recorded matching the active filter.
            </div>
          </div>
        ) : (
          filteredIssues.map((item, filteredIdx) => {
            const editability = checkIssueEditability(item);
            const isItemExcluded = Boolean(item.isExcluded || item.status === 'Excluded');
            const activeFilteredCount = filteredIssues.filter((i) => !i.isExcluded && i.status !== 'Excluded').length;
            return (
              <IssueNavCard
                key={item.id}
                issue={item}
                index={filteredIdx}
                isSelected={selectedIssueId === item.id}
                isReadOnly={!editability.canEdit}
                readOnlyReason={editability.reason || undefined}
                isFirst={isItemExcluded || filteredIdx === 0}
                isLast={isItemExcluded || filteredIdx >= activeFilteredCount - 1}
                isDragging={draggedIssueId === item.id}
                isOver={dragOverIssueId === item.id}
                draggable={!isItemExcluded && (draggableCardId === item.id || true)}
                onSelect={() => onSelectIssue(selectedIssueId === item.id ? null : item.id)}
                onMoveUp={() => handleMoveIssueById(item.id, 'up')}
                onMoveDown={() => handleMoveIssueById(item.id, 'down')}
                onInclude={() => onIncludeIssue?.(item.id)}
                onDragStart={(e) => handleDragStart(e, item.id)}
                onDragOver={(e) => handleDragOver(e, item.id)}
                onDragLeave={(e) => handleDragLeave(e, item.id)}
                onDrop={(e) => handleDrop(e, item.id)}
                onDragEnd={handleDragEnd}
                onDragHandleMouseEnter={() => setDraggableCardId(item.id)}
                onDragHandleMouseLeave={() => {
                  if (!draggedIssueId) setDraggableCardId(null);
                }}
                onDragHandleMouseDown={(e) => {
                  e.stopPropagation();
                  setDraggableCardId(item.id);
                }}
              />
            );
          })
        )}
      </div>
    </aside>
  );
};

export default FindingNavigator;
