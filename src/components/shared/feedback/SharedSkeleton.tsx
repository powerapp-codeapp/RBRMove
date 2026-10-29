import React from 'react';

export type SkeletonVariant = 'text' | 'rectangular' | 'rounded' | 'circular' | 'pill';

export interface SharedSkeletonProps {
  variant?: SkeletonVariant;
  width?: number | string;
  height?: number | string;
  borderRadius?: number | string;
  className?: string;
  style?: React.CSSProperties;
  delayMs?: number;
}

/**
 * Enterprise SaaS Skeleton Shimmer Block
 * Provides a smooth, hardware-accelerated linear shimmer wave for loading states.
 */
export const SharedSkeleton: React.FC<SharedSkeletonProps> = ({
  variant = 'rounded',
  width = '100%',
  height = 14,
  borderRadius,
  className = '',
  style,
  delayMs = 0,
}) => {
  const resolvedRadius = (() => {
    if (borderRadius !== undefined) return borderRadius;
    switch (variant) {
      case 'circular':
        return '50%';
      case 'pill':
        return '9999px';
      case 'text':
        return '4px';
      case 'rounded':
        return '6px';
      case 'rectangular':
      default:
        return '2px';
    }
  })();

  return (
    <span
      aria-hidden="true"
      className={`shared-skeleton-shimmer ${className}`}
      style={{
        display: 'inline-block',
        width,
        height,
        borderRadius: resolvedRadius,
        animationDelay: delayMs ? `${delayMs}ms` : undefined,
        flexShrink: 0,
        ...style,
      }}
    />
  );
};

export interface SharedAuditQueueSkeletonProps {
  rows?: number;
  auditTab?: 'my-actions' | 'all-associated';
}

const ENGAGEMENT_TITLE_WIDTHS = ['76%', '62%', '84%', '68%', '72%', '58%'];
const STATUS_WIDTHS = ['118px', '136px', '96px', '128px', '114px', '104px'];
const OWNER_WIDTHS = ['98px', '112px', '88px', '106px', '94px', '102px'];
const QUEUE_PILL_WIDTHS = ['82px', '74px', '92px', '78px', '86px', '72px'];

/**
 * Enterprise SaaS Skeleton Loader for the Audit Queue Table Cards.
 * Aligns 1:1 with `.audit-queue-card` and `.audit-queue-card-summary` grid columns.
 */
export const SharedAuditQueueSkeleton: React.FC<SharedAuditQueueSkeletonProps> = ({
  rows = 6,
  auditTab = 'my-actions',
}) => {
  const layoutClass = auditTab === 'my-actions' ? 'my-actions-layout' : 'all-associated-layout';

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy="true"
      aria-label="Loading audit engagements"
      style={{ display: 'flex', flexDirection: 'column', width: '100%' }}
    >
      {Array.from({ length: rows }).map((_, idx) => {
        const delay = idx * 65;
        const titleWidth = ENGAGEMENT_TITLE_WIDTHS[idx % ENGAGEMENT_TITLE_WIDTHS.length];
        const statusWidth = STATUS_WIDTHS[idx % STATUS_WIDTHS.length];
        const ownerWidth = OWNER_WIDTHS[idx % OWNER_WIDTHS.length];
        const queuePillWidth = QUEUE_PILL_WIDTHS[idx % QUEUE_PILL_WIDTHS.length];

        return (
          <div
            key={`audit-queue-skeleton-row-${idx}`}
            className="audit-queue-card"
            style={{
              pointerEvents: 'none',
              userSelect: 'none',
            }}
          >
            <div
              className={`audit-queue-card-summary ${layoutClass}`}
              style={{ cursor: 'default' }}
            >
              {/* Column 1: Expand Icon Placeholder */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '44px' }}>
                <SharedSkeleton variant="circular" width={20} height={20} delayMs={delay} />
              </div>

              {/* Column 2: Engagement Title */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', paddingRight: '20px' }}>
                <SharedSkeleton variant="text" width={titleWidth} height={14} delayMs={delay} />
              </div>

              {/* Column 3: Status Dot + Label */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SharedSkeleton variant="circular" width={9} height={9} delayMs={delay} />
                <SharedSkeleton variant="text" width={statusWidth} height={13} delayMs={delay} />
              </div>

              {/* My Actions Layout: Column 4 is Action Issues (Centered) */}
              {auditTab === 'my-actions' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SharedSkeleton variant="rounded" width={36} height={18} borderRadius={4} delayMs={delay} />
                </div>
              )}

              {/* Column: Current Queue Role Pill(s) */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <SharedSkeleton variant="rounded" width={queuePillWidth} height={22} borderRadius={4} delayMs={delay} />
                {idx % 2 === 0 && (
                  <SharedSkeleton variant="rounded" width={26} height={22} borderRadius={4} delayMs={delay} />
                )}
              </div>

              {/* Column: Current Owner Avatar + Name Pill */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <SharedSkeleton variant="circular" width={24} height={24} delayMs={delay} />
                <SharedSkeleton variant="text" width={ownerWidth} height={13} delayMs={delay} />
                {idx % 3 === 0 && (
                  <SharedSkeleton variant="rounded" width={26} height={20} borderRadius={4} delayMs={delay} />
                )}
              </div>

              {/* All Associated Layout: Column 6 is In-Progress (Centered) */}
              {auditTab === 'all-associated' && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <SharedSkeleton variant="rounded" width={34} height={18} borderRadius={4} delayMs={delay} />
                </div>
              )}

              {/* Column 7: Right-Aligned Action Buttons */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end',
                  gap: '8px',
                  paddingRight: '4px',
                }}
              >
                <SharedSkeleton variant="rounded" width={92} height={28} borderRadius={4} delayMs={delay} />
                <SharedSkeleton variant="rounded" width={118} height={28} borderRadius={4} delayMs={delay} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default SharedSkeleton;

