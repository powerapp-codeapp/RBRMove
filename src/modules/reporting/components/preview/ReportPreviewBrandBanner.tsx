import React from 'react';

interface ReportPreviewBrandBannerProps {
  auditableEntityName: string;
}

export const ReportPreviewBrandBanner: React.FC<ReportPreviewBrandBannerProps> = ({
  auditableEntityName,
}) => {
  return (
    <>
      {/* Brand Header Line */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          paddingBottom: '8px',
          marginBottom: '8px',
        }}
      >
        <div>
          <div
            style={{
              fontFamily: 'Georgia, serif',
              fontStyle: 'italic',
              fontSize: '20px',
              fontWeight: 900,
              color: '#E05252',
              letterSpacing: '-0.2px',
            }}
          >
            Johnson&amp;Johnson
          </div>
        </div>

        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: 'var(--type-table-header-size, 13px)',
              fontWeight: 800,
              color: '#737373',
              letterSpacing: '0.4px',
              textTransform: 'uppercase',
            }}
          >
            REPORT DETAILS
          </div>
        </div>

        <div style={{ textAlign: 'right' }}>
          <span style={{ fontSize: 'var(--type-caption-size, 12px)', fontWeight: 700, color: '#737373' }}>
            Global Audit and Assurance
          </span>
        </div>
      </div>

      {/* Auditable Entity Subheader */}
      <div
        style={{
          fontSize: 'var(--type-table-header-size, 12px)',
          fontWeight: 800,
          color: '#000000',
          marginBottom: '16px',
        }}
      >
        Auditable Entity:{' '}
        <span style={{ fontWeight: 600 }}>
          {auditableEntityName}
        </span>
      </div>
    </>
  );
};

