import React, { useState, useMemo } from 'react';
import Drawer from '@mui/material/Drawer';
import {
  FileText,
  X,
  ExternalLink,
  BookOpen
} from 'lucide-react';
import { SharedFieldLabel } from '../common/SharedFieldLabel';

export interface FrameworkReferenceItem {
  no?: number;
  framework_name: string;
  violated_section_clause?: string;
  reason?: string;
  references?: {
    page_number?: string;
    file_link?: string;
    filename?: string;
    file_id?: string;
  };
}

export interface ReferenceComponentProps {
  label?: string;
  value?: string | FrameworkReferenceItem[];
  onChange?: (val: string) => void;
  required?: boolean;
  disabled?: boolean;
  isAiLoading?: boolean;
  helperText?: string;
}

const LOCAL_PDF_URL = './sample_explain.pdf';
const EXTERNAL_PDF_URL =
  'https://www.adobe.com/support/products/enterprise/knowledgecenter/media/c4611_sample_explain.pdf';

/**
 * ReferenceComponent renders structured framework compliance citations and references.
 * Format: Framework Name (medium font weight, clickable) : Section (min font weight) : Reason (regular font weight).
 * Clicking a framework opens a slide-over left drawer previewing the cited PDF standard or workpaper.
 */
export const ReferenceComponent: React.FC<ReferenceComponentProps> = ({
  label = 'References',
  value,
  required = false,
  isAiLoading = false,
  helperText
}) => {
  const [activeItem, setActiveItem] = useState<FrameworkReferenceItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Safely parse raw JSON or plain text into structured items
  const items: FrameworkReferenceItem[] = useMemo(() => {
    if (!value) return [];
    if (Array.isArray(value)) return value;
    if (typeof value === 'object') return [value];

    const strVal = String(value).trim();
    if (!strVal) return [];

    try {
      const parsed = JSON.parse(strVal);
      if (Array.isArray(parsed)) return parsed;
      if (parsed && typeof parsed === 'object') return [parsed];
    } catch {
      // Fallback parser for semicolon/newline delimited text
      const lines = strVal.split(/\n|;/).map((s) => s.trim()).filter(Boolean);
      return lines.map((line, idx) => {
        const parts = line.split(':');
        if (parts.length >= 3) {
          return {
            no: idx + 1,
            framework_name: parts[0].trim(),
            violated_section_clause: parts[1].trim(),
            reason: parts.slice(2).join(':').trim(),
            references: {
              file_link: EXTERNAL_PDF_URL,
              filename: `${parts[0].trim()}.pdf`
            }
          };
        }
        if (parts.length === 2) {
          return {
            no: idx + 1,
            framework_name: parts[0].trim(),
            violated_section_clause: parts[1].trim(),
            reason: '',
            references: { file_link: EXTERNAL_PDF_URL }
          };
        }
        return {
          no: idx + 1,
          framework_name: line,
          violated_section_clause: '',
          reason: '',
          references: { file_link: EXTERNAL_PDF_URL }
        };
      });
    }

    return [];
  }, [value]);

  const handleOpenDrawer = (item: FrameworkReferenceItem) => {
    setActiveItem(item);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    setActiveItem(null);
  };

  const rawFileLink = activeItem?.references?.file_link?.trim();
  const externalLinkUrl =
    rawFileLink && !rawFileLink.includes('example.com') && rawFileLink.startsWith('http')
      ? rawFileLink
      : EXTERNAL_PDF_URL;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* Label with standard spacing */}
      {label && <SharedFieldLabel label={label} required={required} />}

      {/* Main Container without border or separate background color */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '2px 0'
        }}
      >
        {isAiLoading ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', color: '#64748B' }}>
            <div
              style={{
                width: '14px',
                height: '14px',
                borderRadius: '50%',
                border: '2px solid #CBD5E1',
                borderTopColor: '#000099',
                animation: 'spin 0.8s linear infinite'
              }}
            />
            <span style={{ fontSize: '12px' }}>Synthesizing non-compliance references...</span>
          </div>
        ) : items.length > 0 ? (
          items.map((item, idx) => (
            <div
              key={idx}
              style={{
                lineHeight: 1.55,
                fontSize: '12.5px',
                color: '#1E293B'
              }}
            >
              {/* Framework Name (Medium font weight, clickable link) */}
              <button
                type="button"
                onClick={() => handleOpenDrawer(item)}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: 0,
                  margin: 0,
                  fontWeight: 600,
                  color: '#000099',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                  textUnderlineOffset: '2px',
                  fontSize: 'inherit',
                  fontFamily: 'inherit',
                  textAlign: 'left',
                  display: 'inline'
                }}
                title="Click to view referenced policy/standard PDF"
              >
                {item.framework_name}
              </button>

              {/* Section / Clause (Min font weight) */}
              <span style={{ fontWeight: 300, color: '#64748B' }}>
                {' : '}
                {item.violated_section_clause || 'General Requirements'}
              </span>

              {/* Reason (Regular font weight) */}
              {item.reason && (
                <span style={{ fontWeight: 400, color: '#334155' }}>
                  {' : '}
                  {item.reason}
                </span>
              )}
            </div>
          ))
        ) : (
          <span style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>
            No references citations recorded. Click "Generate with AI" or enter details.
          </span>
        )}
      </div>

      {helperText && (
        <span style={{ fontSize: '11px', color: '#64748B', marginTop: '4px' }}>
          {helperText}
        </span>
      )}

      {/* Slide-Over Drawer on Left for PDF Policy Preview */}
      <Drawer
        anchor="left"
        open={isDrawerOpen}
        onClose={handleCloseDrawer}
        slotProps={{
          backdrop: {
            style: { backgroundColor: 'rgba(15, 23, 42, 0.45)' }
          },
          paper: {
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
              zIndex: 1500
            }
          }
        }}
      >
        {/* Drawer Header */}
        <div
          style={{
            backgroundColor: '#000099',
            color: '#FFFFFF',
            padding: '14px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '32px',
                height: '32px',
                borderRadius: '6px',
                backgroundColor: 'rgba(255, 255, 255, 0.12)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF'
              }}
            >
              <BookOpen size={17} />
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 800, color: '#FFFFFF' }}>
                {activeItem?.framework_name || 'Standard Reference'}
              </div>
              <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.85)' }}>
                {activeItem?.violated_section_clause ? `Section / Clause: ${activeItem.violated_section_clause}` : 'Regulatory Framework Citation'}
                {activeItem?.references?.page_number ? ` • ${activeItem.references.page_number}` : ''}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Open in new tab button */}
            <a
              href={externalLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                padding: '4px 10px',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                color: '#FFFFFF',
                borderRadius: '4px',
                fontSize: '11.5px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'background-color 0.15s ease'
              }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.25)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.15)'; }}
            >
              <ExternalLink size={13} />
              <span>Open Tab</span>
            </a>

            <button
              type="button"
              onClick={handleCloseDrawer}
              style={{
                background: 'transparent',
                border: 'none',
                color: '#FFFFFF',
                cursor: 'pointer',
                padding: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px'
              }}
              title="Close drawer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Drawer Meta Sub-bar */}
        <div
          style={{
            backgroundColor: '#F8FAFC',
            borderBottom: '1px solid #E2E8F0',
            padding: '10px 20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '12px',
            color: '#475569',
            flexShrink: 0
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FileText size={14} style={{ color: '#000099' }} />
            <span>Document: <strong>{activeItem?.references?.filename || 'sample_explain.pdf'}</strong></span>
          </div>
          {activeItem?.reason && (
            <div style={{ fontSize: '11.5px', color: '#64748B', maxWidth: '50%', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={activeItem.reason}>
              Finding: {activeItem.reason}
            </div>
          )}
        </div>

        {/* Drawer Body: Embedded PDF Viewer */}
        <div style={{ flex: 1, minHeight: 0, position: 'relative', backgroundColor: '#525659' }}>
          <iframe
            src={`${LOCAL_PDF_URL}#toolbar=1`}
            title={activeItem?.framework_name || 'Standard Reference PDF'}
            style={{
              width: '100%',
              height: '100%',
              border: 'none'
            }}
          />
        </div>
      </Drawer>
    </div>
  );
};

export default ReferenceComponent;
