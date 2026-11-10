import React from 'react';
import { SharedButton, SharedTooltip } from '../../../components/shared';

export interface FindingRowActionsProps {
  editable: boolean;
  onView: (e: React.MouseEvent) => void;
  onEdit: (e: React.MouseEvent) => void;
  onWorkflow: (e: React.MouseEvent) => void;
  onTrackChanges: (e: React.MouseEvent) => void;
}

export const FindingRowActions: React.FC<FindingRowActionsProps> = ({
  editable,
  onView,
  onEdit,
  onWorkflow,
  onTrackChanges,
}) => {
  return (
    <div
      className="inner-row-action-buttons"
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '6px',
        justifyContent: 'flex-end',
      }}
    >
      {!editable ? (
        /* View Only for different function */
        <SharedTooltip title="View Issue (Read-Only)" placement="top">
          <SharedButton
            variant="secondary"
            size="small"
            onClick={onView}
            style={{
              minHeight: 'var(--control-min-height-compact, 1.625rem)',
              padding: '2px 8px',
              fontSize: 'var(--type-caption-size, 11px)',
              fontWeight: 700,
            }}
            aria-label="View Issue (Read-Only)"
          >
            View
          </SharedButton>
        </SharedTooltip>
      ) : (
        /* Same Function: Order = Edit, Workflow, Track Changes */
        <>
          {/* 1. Edit */}
          <SharedTooltip title="Edit Issue in Studio" placement="top">
            <SharedButton
              variant="outline"
              size="small"
              onClick={onEdit}
              style={{
                minHeight: 'var(--control-min-height-compact, 1.625rem)',
                padding: '2px 8px',
                fontSize: 'var(--type-caption-size, 11px)',
                fontWeight: 700,
              }}
              aria-label="Edit Issue in Studio"
            >
              Edit
            </SharedButton>
          </SharedTooltip>

          {/* 2. Workflow */}
          <SharedTooltip title="View Workflow Pipeline" placement="top">
            <SharedButton
              variant="secondary"
              size="small"
              onClick={onWorkflow}
              style={{
                minHeight: 'var(--control-min-height-compact, 1.625rem)',
                padding: '2px 8px',
                fontSize: 'var(--type-caption-size, 11px)',
                fontWeight: 700,
              }}
              aria-label="View Workflow Pipeline"
            >
              Workflow
            </SharedButton>
          </SharedTooltip>

          {/* 3. Track Changes */}
          <SharedTooltip title="Track Changes & Event History" placement="top">
            <SharedButton
              variant="secondary"
              size="small"
              onClick={onTrackChanges}
              style={{
                minHeight: 'var(--control-min-height-compact, 1.625rem)',
                padding: '2px 8px',
                fontSize: 'var(--type-caption-size, 11px)',
                fontWeight: 700,
              }}
              aria-label="Track Changes & Event History"
            >
              Track Changes
            </SharedButton>
          </SharedTooltip>
        </>
      )}
    </div>
  );
};

export default FindingRowActions;

