import React from 'react';
import { Plus, PanelLeftClose } from 'lucide-react';
import { SharedButton } from '../../../components/shared/buttons/SharedButton';
import { SharedListBoxFilter } from '../../../components/shared';
import type { ListBoxFilterOption } from '../../../components/shared';

export interface FindingNavigatorHeaderProps {
  filterDomain: 'all' | 'IT' | 'FinOps';
  onChangeFilterDomain: (val: 'all' | 'IT' | 'FinOps') => void;
  filterOptions: ListBoxFilterOption<'all' | 'IT' | 'FinOps'>[];
  onOpenCreateDialog: () => void;
  onToggleCollapse?: (collapsed: boolean) => void;
}

export const FindingNavigatorHeader: React.FC<FindingNavigatorHeaderProps> = ({
  filterDomain,
  onChangeFilterDomain,
  filterOptions,
  onOpenCreateDialog,
  onToggleCollapse,
}) => {
  return (
    <div
      style={{
        padding: '10px 12px 6px 12px',
        borderBottom: 'none',
        backgroundColor: '#F4F6F8',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '8px',
        flexShrink: 0,
      }}
    >
      {/* Left End: Collapse Button + List Box Filter */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0, flexWrap: 'wrap' }}>
        {onToggleCollapse && (
          <button
            type="button"
            onClick={() => onToggleCollapse(true)}
            title="Collapse Issues List"
            aria-label="Collapse Issues List"
            style={{
              background: 'none',
              border: 'none',
              padding: '4px',
              color: '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
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
            <PanelLeftClose style={{ width: '16px', height: '16px' }} />
          </button>
        )}

        <SharedListBoxFilter<'all' | 'IT' | 'FinOps'>
          options={filterOptions}
          value={filterDomain}
          onChange={(val) => onChangeFilterDomain(val)}
          size="small"
          ariaLabel="Filter issues by domain"
        />
      </div>

      {/* Right End: Add Option */}
      <div style={{ display: 'flex', alignItems: 'center', flexShrink: 0 }}>
        <SharedButton
          variant="outline"
          size="small"
          startIcon={<Plus size={12} color="#000099" />}
          onClick={onOpenCreateDialog}
          style={{
            minHeight: 'var(--control-min-height-compact, 1.625rem)',
            fontSize: 'var(--type-caption-size, 11px)',
            padding: '0 10px',
            backgroundColor: '#ffffff',
            border: '1px solid #000099',
            color: '#000099',
            fontWeight: 700,
          }}
        >
          Add
        </SharedButton>
      </div>
    </div>
  );
};

export default FindingNavigatorHeader;

