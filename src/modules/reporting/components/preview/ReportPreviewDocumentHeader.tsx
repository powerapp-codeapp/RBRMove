import React from 'react';
import { FileText, PanelRightClose } from 'lucide-react';

interface ReportPreviewDocumentHeaderProps {
  fileName: string;
  onCollapse?: () => void;
}

export const ReportPreviewDocumentHeader: React.FC<ReportPreviewDocumentHeaderProps> = ({
  fileName,
  onCollapse,
}) => {
  return (
    <div
      style={{
        backgroundColor: '#D8001D',
        color: '#ffffff',
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        flexShrink: 0,
        borderTopLeftRadius: '3px',
        borderTopRightRadius: '3px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
        <FileText style={{ width: '16px', height: '16px', color: '#ffffff', flexShrink: 0 }} />
        <span
          style={{
            fontSize: 'var(--type-table-header-size, 13px)',
            fontWeight: 800,
            letterSpacing: '0.3px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}
        >
          {fileName}
        </span>
      </div>

      {onCollapse && (
        <button
          type="button"
          onClick={onCollapse}
          title="Collapse Report Preview"
          aria-label="Collapse Report Preview"
          style={{
            background: 'none',
            border: 'none',
            padding: '4px',
            color: '#ffffff',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            width: '28px',
            height: '28px',
            transition: 'background-color 0.15s ease',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)')}
          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'transparent')}
        >
          <PanelRightClose style={{ width: '16px', height: '16px' }} />
        </button>
      )}
    </div>
  );
};

