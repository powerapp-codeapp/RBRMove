import React from 'react';
import { ArrowUpDown } from 'lucide-react';

export interface AuditQueueHeaderProps {
  auditTab: 'my-actions' | 'all-associated';
  onSort: (field: string) => void;
}

export const AuditQueueHeader: React.FC<AuditQueueHeaderProps> = ({
  auditTab,
  onSort,
}) => {
  return (
    <div
      className={`audit-queue-header-grid ${
        auditTab === 'my-actions' ? 'my-actions-layout' : 'all-associated-layout'
      }`}
    >
      {/* Column 1: Expand Spacer */}
      <div style={{ width: '44px', textAlign: 'center' }}></div>

      {/* Column 2: Engagement */}
      <div
        className="audit-queue-header-col sortable"
        onClick={() => onSort('engagement')}
        role="button"
        tabIndex={0}
      >
        <span>Engagement</span>
        <ArrowUpDown size={12} className="th-sort-icon" />
      </div>

      {/* Column 3: Engagement Status */}
      <div
        className="audit-queue-header-col sortable"
        onClick={() => onSort('status')}
        role="button"
        tabIndex={0}
      >
        <span>Status</span>
        <ArrowUpDown size={12} className="th-sort-icon" />
      </div>

      {/* When My Action Audits: Action Issues is placed right next to Status */}
      {auditTab === 'my-actions' && (
        <div className="audit-queue-header-col center">
          <span>Action Issues</span>
        </div>
      )}

      {/* Current Queue */}
      <div
        className="audit-queue-header-col sortable"
        onClick={() => onSort('currentQueue')}
        role="button"
        tabIndex={0}
      >
        <span>Current Queue</span>
        <ArrowUpDown size={12} className="th-sort-icon" />
      </div>

      {/* Current Owner */}
      <div
        className="audit-queue-header-col sortable"
        onClick={() => onSort('currentOwner')}
        role="button"
        tabIndex={0}
      >
        <span>Current Owner</span>
        <ArrowUpDown size={12} className="th-sort-icon" />
      </div>

      {/* When All Associated Audits: Keep only In-Progress column in primary row */}
      {auditTab === 'all-associated' && (
        <div className="audit-queue-header-col center">
          <span>In-Progress</span>
        </div>
      )}

      {/* Column: Actions */}
      <div className="audit-queue-header-col right">
        <span>Actions</span>
      </div>
    </div>
  );
};

export default AuditQueueHeader;

