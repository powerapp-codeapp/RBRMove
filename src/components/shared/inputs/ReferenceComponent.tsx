import React, { useState, useMemo } from 'react';
import Drawer from '@mui/material/Drawer';
import {
  FileText,
  X,
  ExternalLink,
  BookOpen,
  Pencil,
  Trash2,
  Plus,
  Check,
} from 'lucide-react';
import { SharedFieldLabel } from '../common/SharedFieldLabel';
import { SharedButton } from '../buttons/SharedButton';

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
  extraHeaderActions?: React.ReactNode;
}

const LOCAL_PDF_URL = './sample_explain.pdf';
const EXTERNAL_PDF_URL =
  'https://www.adobe.com/support/products/enterprise/knowledgecenter/media/c4611_sample_explain.pdf';

/**
 * ReferenceComponent renders structured framework compliance citations and references.
 * Format: Framework Name (medium font weight, clickable) : Section (min font weight) : Reason (regular font weight).
 * Clicking a framework opens a slide-over left drawer previewing the cited PDF standard or workpaper.
 * Supports add, edit, and delete operations when not disabled.
 */
export const ReferenceComponent: React.FC<ReferenceComponentProps> = ({
  label = 'References',
  value,
  onChange,
  required = false,
  disabled = false,
  isAiLoading = false,
  helperText,
  extraHeaderActions,
}) => {
  const [activeItem, setActiveItem] = useState<FrameworkReferenceItem | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Edit / Add state
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [isAddingNew, setIsAddingNew] = useState(false);
  const [formFramework, setFormFramework] = useState('');
  const [formSection, setFormSection] = useState('');
  const [formReason, setFormReason] = useState('');
  const [formError, setFormError] = useState('');

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
              filename: `${parts[0].trim()}.pdf`,
            },
          };
        }
        if (parts.length === 2) {
          return {
            no: idx + 1,
            framework_name: parts[0].trim(),
            violated_section_clause: parts[1].trim(),
            reason: '',
            references: { file_link: EXTERNAL_PDF_URL },
          };
        }
        return {
          no: idx + 1,
          framework_name: line,
          violated_section_clause: '',
          reason: '',
          references: { file_link: EXTERNAL_PDF_URL },
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

  const handleStartEdit = (idx: number, item: FrameworkReferenceItem) => {
    setEditingIdx(idx);
    setIsAddingNew(false);
    setFormFramework(item.framework_name || '');
    setFormSection(item.violated_section_clause || '');
    setFormReason(item.reason || '');
    setFormError('');
  };

  const handleStartAdd = () => {
    setIsAddingNew(true);
    setEditingIdx(null);
    setFormFramework('');
    setFormSection('');
    setFormReason('');
    setFormError('');
  };

  const handleCancelForm = () => {
    setEditingIdx(null);
    setIsAddingNew(false);
    setFormError('');
  };

  const handleSaveForm = () => {
    if (!formFramework.trim()) {
      setFormError('Framework Name is required.');
      return;
    }

    let updated: FrameworkReferenceItem[];
    if (isAddingNew) {
      const newItem: FrameworkReferenceItem = {
        no: items.length + 1,
        framework_name: formFramework.trim(),
        violated_section_clause: formSection.trim() || 'General Requirements',
        reason: formReason.trim(),
        references: {
          file_link: EXTERNAL_PDF_URL,
          filename: `${formFramework.trim()}.pdf`,
        },
      };
      updated = [...items, newItem];
    } else if (editingIdx !== null) {
      updated = items.map((it, idx) => {
        if (idx === editingIdx) {
          return {
            ...it,
            framework_name: formFramework.trim(),
            violated_section_clause: formSection.trim() || 'General Requirements',
            reason: formReason.trim(),
            references: {
              ...(it.references || {}),
              file_link: it.references?.file_link || EXTERNAL_PDF_URL,
              filename: `${formFramework.trim()}.pdf`,
            },
          };
        }
        return it;
      });
    } else {
      return;
    }

    onChange?.(JSON.stringify(updated));
    setEditingIdx(null);
    setIsAddingNew(false);
    setFormError('');
  };

  const handleDelete = (idx: number) => {
    const updated = items.filter((_, i) => i !== idx);
    onChange?.(JSON.stringify(updated));
    if (editingIdx === idx) {
      setEditingIdx(null);
    }
  };

  const rawFileLink = activeItem?.references?.file_link?.trim();
  const externalLinkUrl =
    rawFileLink && !rawFileLink.includes('example.com') && rawFileLink.startsWith('http')
      ? rawFileLink
      : EXTERNAL_PDF_URL;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', width: '100%' }}>
      {/* Header: Label + extraHeaderActions (e.g. comment trigger) */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '6px',
        }}
      >
        {label && <SharedFieldLabel label={label} required={required} />}
        {extraHeaderActions && <div>{extraHeaderActions}</div>}
      </div>

      {/* Main Container */}
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: '8px',
          padding: '2px 0',
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
                animation: 'spin 0.8s linear infinite',
              }}
            />
            <span style={{ fontSize: '12px' }}>Synthesizing non-compliance references...</span>
          </div>
        ) : items.length > 0 ? (
          items.map((item, idx) => {
            const isThisEditing = editingIdx === idx;

            if (isThisEditing) {
              return (
                <div
                  key={idx}
                  style={{
                    backgroundColor: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    borderRadius: '6px',
                    padding: '12px 14px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px',
                    boxShadow: '0 1px 3px rgba(0, 0, 153, 0.08)',
                  }}
                >
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#1E3A8A' }}>
                    Edit Reference Citation #{idx + 1}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#334155', marginBottom: '3px' }}>
                        Framework Name *
                      </label>
                      <input
                        type="text"
                        value={formFramework}
                        onChange={(e) => setFormFramework(e.target.value)}
                        placeholder="e.g. ISO 27001, GxP Data Integrity"
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          fontSize: '12px',
                          borderRadius: '4px',
                          border: formError ? '1px solid #EF4444' : '1px solid #CBD5E1',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#334155', marginBottom: '3px' }}>
                        Violated Section / Clause
                      </label>
                      <input
                        type="text"
                        value={formSection}
                        onChange={(e) => setFormSection(e.target.value)}
                        placeholder="e.g. Section A.9.2.6, Annex 11"
                        style={{
                          width: '100%',
                          padding: '6px 10px',
                          fontSize: '12px',
                          borderRadius: '4px',
                          border: '1px solid #CBD5E1',
                          outline: 'none',
                          boxSizing: 'border-box',
                        }}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#334155', marginBottom: '3px' }}>
                      Reason / Non-Compliance Observation
                    </label>
                    <textarea
                      value={formReason}
                      onChange={(e) => setFormReason(e.target.value)}
                      placeholder="Detail why this standard was cited..."
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '6px 10px',
                        fontSize: '12px',
                        borderRadius: '4px',
                        border: '1px solid #CBD5E1',
                        outline: 'none',
                        boxSizing: 'border-box',
                        resize: 'vertical',
                      }}
                    />
                  </div>

                  {formError && (
                    <div style={{ fontSize: '11px', color: '#EF4444', fontWeight: 600 }}>
                      {formError}
                    </div>
                  )}

                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', paddingTop: '4px' }}>
                    <SharedButton variant="outline" size="small" onClick={handleCancelForm} style={{ minHeight: '1.625rem', fontSize: '11.5px', padding: '0 10px' }}>
                      Cancel
                    </SharedButton>
                    <SharedButton variant="primary" size="small" startIcon={<Check size={12} />} onClick={handleSaveForm} style={{ minHeight: '1.625rem', fontSize: '11.5px', padding: '0 12px' }}>
                      Save Reference
                    </SharedButton>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={idx}
                style={{
                  lineHeight: 1.55,
                  fontSize: '12.5px',
                  color: '#1E293B',
                  display: 'flex',
                  alignItems: 'flex-start',
                  justifyContent: 'space-between',
                  gap: '8px',
                  padding: '3px 6px',
                  borderRadius: '4px',
                  transition: 'background-color 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (!disabled) e.currentTarget.style.backgroundColor = '#F8FAFC';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
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
                      display: 'inline',
                    }}
                    title="Click to view referenced policy/standard PDF in preview drawer"
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

                {/* Edit & Delete Action Buttons */}
                {!disabled && (
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', flexShrink: 0, opacity: 0.85 }}>
                    <button
                      type="button"
                      onClick={() => handleStartEdit(idx, item)}
                      title="Edit reference citation"
                      aria-label="Edit reference citation"
                      style={{
                        border: 'none',
                        background: 'none',
                        color: '#64748B',
                        cursor: 'pointer',
                        padding: '2px 4px',
                        borderRadius: '3px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#000099';
                        e.currentTarget.style.backgroundColor = '#EFF6FF';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#64748B';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <Pencil size={12} />
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDelete(idx)}
                      title="Delete reference citation"
                      aria-label="Delete reference citation"
                      style={{
                        border: 'none',
                        background: 'none',
                        color: '#94A3B8',
                        cursor: 'pointer',
                        padding: '2px 4px',
                        borderRadius: '3px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = '#EF4444';
                        e.currentTarget.style.backgroundColor = '#FEE2E2';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = '#94A3B8';
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <span style={{ fontSize: '12px', color: '#94A3B8', fontStyle: 'italic' }}>
            No framework citations recorded. Click &ldquo;+ Add Reference&rdquo; or synthesize via AI.
          </span>
        )}

        {/* Inline Add New Reference Form */}
        {isAddingNew && (
          <div
            style={{
              backgroundColor: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: '6px',
              padding: '12px 14px',
              display: 'flex',
              flexDirection: 'column',
              gap: '10px',
              boxShadow: '0 1px 3px rgba(0, 0, 153, 0.08)',
              marginTop: '4px',
            }}
          >
            <div style={{ fontSize: '12px', fontWeight: 700, color: '#1E3A8A' }}>
              Add New Framework Reference Citation
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#334155', marginBottom: '3px' }}>
                  Framework Name *
                </label>
                <input
                  type="text"
                  value={formFramework}
                  onChange={(e) => setFormFramework(e.target.value)}
                  placeholder="e.g. ISO 27001, GxP Annex 11, NIST CSF"
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    fontSize: '12px',
                    borderRadius: '4px',
                    border: formError ? '1px solid #EF4444' : '1px solid #CBD5E1',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#334155', marginBottom: '3px' }}>
                  Violated Section / Clause
                </label>
                <input
                  type="text"
                  value={formSection}
                  onChange={(e) => setFormSection(e.target.value)}
                  placeholder="e.g. Section A.9.2.6, Clause 4.1"
                  style={{
                    width: '100%',
                    padding: '6px 10px',
                    fontSize: '12px',
                    borderRadius: '4px',
                    border: '1px solid #CBD5E1',
                    outline: 'none',
                    boxSizing: 'border-box',
                  }}
                />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 600, color: '#334155', marginBottom: '3px' }}>
                Reason / Non-Compliance Observation
              </label>
              <textarea
                value={formReason}
                onChange={(e) => setFormReason(e.target.value)}
                placeholder="Detail the requirement and observed condition gap..."
                rows={2}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  fontSize: '12px',
                  borderRadius: '4px',
                  border: '1px solid #CBD5E1',
                  outline: 'none',
                  boxSizing: 'border-box',
                  resize: 'vertical',
                }}
              />
            </div>

            {formError && (
              <div style={{ fontSize: '11px', color: '#EF4444', fontWeight: 600 }}>
                {formError}
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'flex-end', paddingTop: '4px' }}>
              <SharedButton variant="outline" size="small" onClick={handleCancelForm} style={{ minHeight: '1.625rem', fontSize: '11.5px', padding: '0 10px' }}>
                Cancel
              </SharedButton>
              <SharedButton variant="primary" size="small" startIcon={<Check size={12} />} onClick={handleSaveForm} style={{ minHeight: '1.625rem', fontSize: '11.5px', padding: '0 12px' }}>
                Add Reference
              </SharedButton>
            </div>
          </div>
        )}

        {/* Add Reference Button (when not disabled and form not active) */}
        {!disabled && !isAddingNew && editingIdx === null && (
          <div style={{ paddingTop: '2px' }}>
            <button
              type="button"
              onClick={handleStartAdd}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '4px',
                padding: '3px 10px',
                fontSize: '11.5px',
                fontWeight: 600,
                color: '#000099',
                backgroundColor: '#F8FAFC',
                border: '1px dashed #CBD5E1',
                borderRadius: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#EFF6FF';
                e.currentTarget.style.borderColor = '#93C5FD';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#F8FAFC';
                e.currentTarget.style.borderColor = '#CBD5E1';
              }}
            >
              <Plus size={12} />
              <span>Add Reference Citation</span>
            </button>
          </div>
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
            style: { backgroundColor: 'rgba(15, 23, 42, 0.45)' },
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
              zIndex: 1500,
            },
          },
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
            flexShrink: 0,
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
                color: '#FFFFFF',
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
                transition: 'background-color 0.15s ease',
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
                borderRadius: '4px',
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
            flexShrink: 0,
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
              border: 'none',
            }}
          />
        </div>
      </Drawer>
    </div>
  );
};

export default ReferenceComponent;
