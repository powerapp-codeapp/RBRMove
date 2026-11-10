import React from 'react';

interface ReportPreviewFooterProps {
  pageText: string;
}

export const ReportPreviewFooter: React.FC<ReportPreviewFooterProps> = ({ pageText }) => {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginTop: 'auto',
        paddingTop: '16px',
        fontSize: '10px',
        color: '#555555',
        position: 'relative',
      }}
    >
      {/* Left: Page Number */}
      <div style={{ color: '#555555' }}>
        {pageText}
      </div>

      {/* Center: Confidential Statement */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          transform: 'translateX(-50%)',
          textAlign: 'center',
          color: '#555555',
          fontSize: '10px',
        }}
      >
        Confidential – Use Pursuant to Company Instructions
      </div>

      <div />
    </div>
  );
};

