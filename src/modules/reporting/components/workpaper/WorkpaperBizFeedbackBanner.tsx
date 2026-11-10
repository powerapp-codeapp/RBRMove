import React from 'react';
import { MessageSquare } from 'lucide-react';
import { SharedTooltip } from '../../../../components/shared/feedback/SharedTooltip';

interface WorkpaperBizFeedbackBannerProps {
  totalCount: number;
  openCount: number;
  onOpenDrawer: () => void;
}

export const WorkpaperBizFeedbackBanner: React.FC<WorkpaperBizFeedbackBannerProps> = ({
  totalCount,
  openCount,
  onOpenDrawer,
}) => {
  if (totalCount === 0) return null;

  return (
    <div style={{ display: 'flex', alignItems: 'center', paddingTop: '2px' }}>
      <SharedTooltip
        title={
          openCount > 0
            ? `Business Owner Comments (${openCount} open of ${totalCount}) — Click to view in right drawer`
            : `All ${totalCount} Business Owner comments marked as done — Click to view`
        }
        placement="top"
      >
        <button
          type="button"
          onClick={onOpenDrawer}
          aria-label="Open Business Owner Comments Drawer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            padding: '3px 9px',
            borderRadius: '999px',
            border: '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            color: '#334155',
            fontSize: '11.5px',
            fontWeight: 600,
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'all 0.15s ease',
            boxShadow: '0 1px 2px rgba(15, 23, 42, 0.05)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#F8FAFC';
            e.currentTarget.style.borderColor = '#CBD5E1';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FFFFFF';
            e.currentTarget.style.borderColor = '#E2E8F0';
          }}
        >
          <MessageSquare
            size={13}
            style={{
              color: '#334155',
              flexShrink: 0,
            }}
          />
          <span>Business Comments</span>
          <span
            style={{
              backgroundColor: '#64748B',
              color: '#FFFFFF',
              borderRadius: '999px',
              padding: '0 5px',
              fontSize: '10px',
              fontWeight: 700,
              lineHeight: '15px',
              minWidth: '15px',
              textAlign: 'center',
            }}
          >
            {openCount > 0 ? openCount : `✓ ${totalCount}`}
          </span>
        </button>
      </SharedTooltip>
    </div>
  );
};

