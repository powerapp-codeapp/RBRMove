import React from 'react';
import Drawer from '@mui/material/Drawer';
import { BookOpen, ExternalLink, X } from 'lucide-react';

export interface PdfPreviewDrawerProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  filename?: string;
  pdfUrl: string;
  externalLinkUrl?: string;
  reason?: string;
}

export const PdfPreviewDrawer: React.FC<PdfPreviewDrawerProps> = ({
  open,
  onClose,
  title = 'Standard Reference',
  subtitle = 'Regulatory Framework Citation',
  pdfUrl,
  externalLinkUrl,
}) => {
  const externalHref = externalLinkUrl || pdfUrl;

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      slotProps={{
        backdrop: {
          style: { backgroundColor: 'rgba(15, 23, 42, 0.45)' },
        },
        paper: {
          className: 'slim-light-scrollbar pdf-preview-drawer-paper',
          style: {
            width: 'clamp(540px, 50vw, 840px)',
            maxWidth: '94vw',
            height: '100%',
            backgroundColor: '#FFFFFF',
            boxShadow: '6px 0 24px rgba(0, 0, 0, 0.15)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
            zIndex: 1500,
          },
        },
      }}
    >
      {/* Drawer Header (Light Grey Background with Dark Text & Accent Controls) */}
      <div
        style={{
          backgroundColor: '#F4F4F4',
          borderBottom: '1px solid #E2E8F0',
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000099',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)',
            }}
          >
            <BookOpen size={17} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>
              {title}
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748B' }}>
              {subtitle}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {externalHref && (
            <a
              href={externalHref}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                backgroundColor: '#FFFFFF',
                border: '1px solid #CBD5E1',
                color: '#000099',
                borderRadius: '4px',
                fontSize: '11.5px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#EFF6FF';
                e.currentTarget.style.borderColor = '#93C5FD';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#FFFFFF';
                e.currentTarget.style.borderColor = '#CBD5E1';
              }}
            >
              <ExternalLink size={13} />
              <span>Open Tab</span>
            </a>
          )}

          <button
            type="button"
            onClick={onClose}
            style={{
              background: 'transparent',
              border: 'none',
              color: '#64748B',
              cursor: 'pointer',
              padding: '5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              transition: 'all 0.15s ease',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#E2E8F0';
              e.currentTarget.style.color = '#0F172A';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent';
              e.currentTarget.style.color = '#64748B';
            }}
            title="Close drawer"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Drawer Body: Clean Embedded PDF Viewer with Dark Grey Background & Slim Scrollbar */}
      <div
        className="slim-light-scrollbar pdf-preview-drawer-body"
        style={{
          flex: 1,
          minHeight: 0,
          position: 'relative',
          backgroundColor: '#374151',
          overflowY: 'auto',
          scrollbarWidth: 'thin',
          scrollbarColor: '#CBD5E1 transparent',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <iframe
          src={`${pdfUrl}#toolbar=0&navpanes=0&scrollbar=1&view=FitH`}
          title={title}
          className="slim-light-scrollbar"
          style={{
            width: '100%',
            height: '100%',
            flex: 1,
            border: 'none',
            backgroundColor: '#374151',
            display: 'block',
          }}
        />
      </div>
    </Drawer>
  );
};

export default PdfPreviewDrawer;
