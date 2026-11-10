import React, { useState, useMemo } from 'react';
import Drawer from '@mui/material/Drawer';
import {
  X,
  ChevronDown,
  ChevronsUpDown,
  BookOpen
} from 'lucide-react';
import type { QualityGuidelinesPayload } from '../data/mockGuidelinesData';
import { MOCK_QUALITY_GUIDELINES } from '../data/mockGuidelinesData';

export interface GuidelinesDrawerProps {
  open: boolean;
  onClose: () => void;
  guidelines?: QualityGuidelinesPayload;
}

const FIELD_DISPLAY_NAMES: Record<string, string> = {
  ISSUE_HEADER: 'Issue Title',
  ISSUE_STATEMENT: 'Description / Condition Narrative',
  ROOT_CAUSE: 'Root Cause',
  IMPACT: 'Impact & Exposure',
  RECOMMENDATIONS: 'Recommendations'
};

const ORDERED_FIELDS = [
  'ISSUE_HEADER',
  'ISSUE_STATEMENT',
  'ROOT_CAUSE',
  'IMPACT',
  'RECOMMENDATIONS'
];

export const GuidelinesDrawer: React.FC<GuidelinesDrawerProps> = ({
  open,
  onClose,
  guidelines = MOCK_QUALITY_GUIDELINES
}) => {
  // Aggregate only fields that actually have items in the payload
  const activeFields = useMemo(() => {
    const fieldCounts: Record<string, number> = {};

    const registerItem = (fieldName?: string) => {
      if (!fieldName) return;
      fieldCounts[fieldName] = (fieldCounts[fieldName] || 0) + 1;
    };

    guidelines.strengths?.forEach((s) => registerItem(s.field_name));
    guidelines.pef_violations?.forEach((v) => registerItem(v.field_name));
    guidelines.clarifying_questions?.forEach((q) => registerItem(q.field_name));
    guidelines.review_comments?.forEach((c) => registerItem(c.field_name));
    guidelines.undefined_acronyms?.forEach((a) => registerItem(a.field_name));
    guidelines.improvement_recommendations?.forEach((r) => registerItem(r.field_name));

    // Keep only fields with count > 0
    const fieldsWithData = Object.keys(fieldCounts).filter((f) => fieldCounts[f] > 0);

    // Sort according to preferred field order, then any additional unmapped fields
    return fieldsWithData.sort((a, b) => {
      const idxA = ORDERED_FIELDS.indexOf(a);
      const idxB = ORDERED_FIELDS.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [guidelines]);

  // Accordion state: expand all fields with data by default
  const [expandedFields, setExpandedFields] = useState<Record<string, boolean>>(() => {
    const initial: Record<string, boolean> = {};
    ORDERED_FIELDS.forEach((f) => {
      initial[f] = true;
    });
    return initial;
  });

  const toggleField = (fieldKey: string) => {
    setExpandedFields((prev) => ({
      ...prev,
      [fieldKey]: !prev[fieldKey]
    }));
  };

  const handleExpandAll = () => {
    const next: Record<string, boolean> = {};
    activeFields.forEach((f) => {
      next[f] = true;
    });
    setExpandedFields(next);
  };

  const handleCollapseAll = () => {
    const next: Record<string, boolean> = {};
    activeFields.forEach((f) => {
      next[f] = false;
    });
    setExpandedFields(next);
  };

  const allExpanded = activeFields.length > 0 && activeFields.every((f) => expandedFields[f]);

  // Total count of items across all categories
  const totalItems =
    (guidelines.strengths?.length || 0) +
    (guidelines.pef_violations?.length || 0) +
    (guidelines.clarifying_questions?.length || 0) +
    (guidelines.review_comments?.length || 0) +
    (guidelines.undefined_acronyms?.length || 0) +
    (guidelines.improvement_recommendations?.length || 0);

  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      slotProps={{
        backdrop: {
          style: { backgroundColor: 'rgba(15, 23, 42, 0.45)' }
        },
        paper: {
          className: 'slim-light-scrollbar pdf-preview-drawer-paper',
          style: {
            width: 'clamp(560px, 50vw, 820px)',
            maxWidth: '95vw',
            height: '100%',
            backgroundColor: '#F8FAFC',
            boxShadow: '6px 0 28px rgba(0, 0, 0, 0.16)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
            zIndex: 1500
          }
        }
      }}
    >
      {/* Drawer Header (Light Grey Background matching PDF Preview Drawer) */}
      <div
        style={{
          backgroundColor: '#F4F4F4',
          borderBottom: '1px solid #E2E8F0',
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
              backgroundColor: '#FFFFFF',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#000099',
              boxShadow: '0 1px 2px rgba(0, 0, 0, 0.04)'
            }}
          >
            <BookOpen size={17} />
          </div>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 700, color: '#1E293B' }}>
              AI POV
            </div>
            <div style={{ fontSize: '11.5px', color: '#64748B' }}>
              Field-level guidelines, PEF standards, and review suggestions
            </div>
          </div>
        </div>

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
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#E2E8F0';
            e.currentTarget.style.color = '#0F172A';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = '#64748B';
          }}
          title="Close AI POV drawer"
        >
          <X size={18} />
        </button>
      </div>

      {/* Sub-header Controls */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          padding: '10px 20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '12px', fontWeight: 700, color: '#0F172A' }}>
            Applicable Guidelines
          </span>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 600,
              color: '#475569',
              backgroundColor: '#F1F5F9',
              padding: '1px 8px',
              borderRadius: '12px',
              border: '1px solid #E2E8F0'
            }}
          >
            {totalItems} items across {activeFields.length} fields
          </span>
        </div>

        <button
          type="button"
          onClick={allExpanded ? handleCollapseAll : handleExpandAll}
          style={{
            background: '#FFFFFF',
            border: '1px solid #CBD5E1',
            borderRadius: '4px',
            padding: '4px 10px',
            fontSize: '11.5px',
            fontWeight: 600,
            color: '#334155',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            transition: 'all 0.15s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = '#F8FAFC';
            e.currentTarget.style.borderColor = '#94A3B8';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = '#FFFFFF';
            e.currentTarget.style.borderColor = '#CBD5E1';
          }}
        >
          <ChevronsUpDown size={12} />
          <span>{allExpanded ? 'Collapse All' : 'Expand All'}</span>
        </button>
      </div>

      {/* Drawer Body: Field-Wise Accordions (Slim Scrollbar) */}
      <div
        className="slim-light-scrollbar pdf-preview-drawer-body"
        style={{
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '14px',
          scrollbarWidth: 'thin',
          scrollbarColor: '#CBD5E1 transparent'
        }}
      >
        {activeFields.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
            No guidelines applicable for this issue.
          </div>
        ) : (
          activeFields.map((fieldKey) => {
            const isExpanded = !!expandedFields[fieldKey];
            const displayName = FIELD_DISPLAY_NAMES[fieldKey] || fieldKey.replace(/_/g, ' ');

            // Extract category items for this specific field
            const strengths = guidelines.strengths?.filter((s) => s.field_name === fieldKey) || [];
            const violations = guidelines.pef_violations?.filter((v) => v.field_name === fieldKey) || [];
            const questions = guidelines.clarifying_questions?.filter((q) => q.field_name === fieldKey) || [];
            const comments = guidelines.review_comments?.filter((c) => c.field_name === fieldKey) || [];
            const acronyms = guidelines.undefined_acronyms?.filter((a) => a.field_name === fieldKey) || [];
            const improvements = guidelines.improvement_recommendations?.filter((r) => r.field_name === fieldKey) || [];

            const fieldTotal =
              strengths.length +
              violations.length +
              questions.length +
              comments.length +
              acronyms.length +
              improvements.length;

            return (
              <div
                key={fieldKey}
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: '6px',
                  border: '1px solid #D1D5DB',
                  boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                  overflow: 'hidden',
                  flexShrink: 0
                }}
              >
                {/* 1. Field Section Header (Deep Black & Bold Headline) */}
                <div
                  onClick={() => toggleField(fieldKey)}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: isExpanded ? '#F8FAFC' : '#FFFFFF',
                    borderBottom: isExpanded ? '1px solid #E2E8F0' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    userSelect: 'none',
                    transition: 'background-color 0.15s ease'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                        transition: 'transform 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        color: '#0F172A'
                      }}
                    >
                      <ChevronDown size={16} />
                    </div>

                    <span style={{ fontSize: '14px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.1px' }}>
                      {displayName}
                    </span>
                  </div>

                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 600,
                      color: '#475569',
                      backgroundColor: '#F1F5F9',
                      border: '1px solid #E2E8F0',
                      padding: '2px 8px',
                      borderRadius: '12px'
                    }}
                  >
                    {fieldTotal} {fieldTotal === 1 ? 'item' : 'items'}
                  </span>
                </div>

                {/* Field Section Content: Category Groups & Bullet Lists */}
                {isExpanded && (
                  <div
                    style={{
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '18px'
                    }}
                  >
                    {/* Category Group 1: PEF Violations (Unboxed Bullet List with Multi-Row Fields) */}
                    {violations.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {/* Group Title: Matching Engagement Name Properties */}
                        <div
                          className="type-studio-title"
                          style={{
                            fontSize: 'var(--type-studio-title-size, 15px)',
                            fontWeight: 500,
                            color: 'var(--type-studio-title-color, #334155)',
                            lineHeight: 'var(--type-studio-title-leading, 1.3)' as any,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <span>PEF Violations</span>
                          <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748B' }}>
                            ({violations.length})
                          </span>
                        </div>

                        {/* Unboxed Bullet List for Violations */}
                        <ul
                          style={{
                            margin: 0,
                            paddingLeft: '18px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            listStyleType: 'disc'
                          }}
                        >
                          {violations.map((v, idx) => (
                            <li key={idx} style={{ color: '#334155' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                {/* Guideline */}
                                <div>
                                  <span
                                    style={{
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      color: '#64748B',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.4px'
                                    }}
                                  >
                                    Guideline:{' '}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 'var(--type-table-row-size, 12.5px)',
                                      fontWeight: 400,
                                      color: '#334155',
                                      lineHeight: 1.5
                                    }}
                                  >
                                    {v.guideline}
                                  </span>
                                </div>

                                {/* Evidence Quote (no inner boxes) */}
                                {v.evidence_quote && (
                                  <div>
                                    <span
                                      style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: '#64748B',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.4px'
                                      }}
                                    >
                                      Evidence Quote:{' '}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: 'var(--type-table-row-size, 12.5px)',
                                        fontWeight: 400,
                                        color: '#334155',
                                        lineHeight: 1.5,
                                        fontStyle: 'italic'
                                      }}
                                    >
                                      "{v.evidence_quote}"
                                    </span>
                                  </div>
                                )}

                                {/* Reason */}
                                <div>
                                  <span
                                    style={{
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      color: '#64748B',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.4px'
                                    }}
                                  >
                                    Reason:{' '}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 'var(--type-table-row-size, 12.5px)',
                                      fontWeight: 400,
                                      color: '#334155',
                                      lineHeight: 1.5
                                    }}
                                  >
                                    {v.reason}
                                  </span>
                                </div>

                                {/* Suggestion */}
                                {v.suggestion && (
                                  <div>
                                    <span
                                      style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: '#64748B',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.4px'
                                      }}
                                    >
                                      Suggestion:{' '}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: 'var(--type-table-row-size, 12.5px)',
                                        fontWeight: 400,
                                        color: '#334155',
                                        lineHeight: 1.5
                                      }}
                                    >
                                      {v.suggestion}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Category Group 2: Undefined Acronyms (Unboxed Bullet List with Multi-Row Fields) */}
                    {acronyms.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {/* Group Title: Matching Engagement Name Properties */}
                        <div
                          className="type-studio-title"
                          style={{
                            fontSize: 'var(--type-studio-title-size, 15px)',
                            fontWeight: 500,
                            color: 'var(--type-studio-title-color, #334155)',
                            lineHeight: 'var(--type-studio-title-leading, 1.3)' as any,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <span>Undefined Acronyms</span>
                          <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748B' }}>
                            ({acronyms.length})
                          </span>
                        </div>

                        {/* Unboxed Bullet List for Acronyms */}
                        <ul
                          style={{
                            margin: 0,
                            paddingLeft: '18px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '12px',
                            listStyleType: 'disc'
                          }}
                        >
                          {acronyms.map((ac, idx) => (
                            <li key={idx} style={{ color: '#334155' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                                {/* Acronym */}
                                <div>
                                  <span
                                    style={{
                                      fontSize: '11px',
                                      fontWeight: 600,
                                      color: '#64748B',
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.4px'
                                    }}
                                  >
                                    Acronym:{' '}
                                  </span>
                                  <span
                                    style={{
                                      fontSize: 'var(--type-table-row-size, 12.5px)',
                                      fontWeight: 600,
                                      color: '#334155',
                                      letterSpacing: '0.5px'
                                    }}
                                  >
                                    {ac.acronym}
                                  </span>
                                </div>

                                {/* Suggested Definition */}
                                {ac.suggested_definition && (
                                  <div>
                                    <span
                                      style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: '#64748B',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.4px'
                                      }}
                                    >
                                      Suggested Definition:{' '}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: 'var(--type-table-row-size, 12.5px)',
                                        fontWeight: 400,
                                        color: '#334155',
                                        lineHeight: 1.5
                                      }}
                                    >
                                      {ac.suggested_definition}
                                    </span>
                                  </div>
                                )}

                                {/* Evidence Quote (no inner boxes) */}
                                {ac.evidence_quote && (
                                  <div>
                                    <span
                                      style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: '#64748B',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.4px'
                                      }}
                                    >
                                      Evidence Quote:{' '}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: 'var(--type-table-row-size, 12.5px)',
                                        fontWeight: 400,
                                        color: '#334155',
                                        lineHeight: 1.5,
                                        fontStyle: 'italic'
                                      }}
                                    >
                                      "{ac.evidence_quote}"
                                    </span>
                                  </div>
                                )}

                                {/* Comment */}
                                {ac.comment && (
                                  <div>
                                    <span
                                      style={{
                                        fontSize: '11px',
                                        fontWeight: 600,
                                        color: '#64748B',
                                        textTransform: 'uppercase',
                                        letterSpacing: '0.4px'
                                      }}
                                    >
                                      Comment:{' '}
                                    </span>
                                    <span
                                      style={{
                                        fontSize: 'var(--type-table-row-size, 12.5px)',
                                        fontWeight: 400,
                                        color: '#334155',
                                        lineHeight: 1.5
                                      }}
                                    >
                                      {ac.comment}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Category Group 3: Clarifying Questions (Clean Unboxed Bullet List) */}
                    {questions.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {/* Group Title: Matching Engagement Name Properties */}
                        <div
                          className="type-studio-title"
                          style={{
                            fontSize: 'var(--type-studio-title-size, 15px)',
                            fontWeight: 500,
                            color: 'var(--type-studio-title-color, #334155)',
                            lineHeight: 'var(--type-studio-title-leading, 1.3)' as any,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <span>Clarifying Questions</span>
                          <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748B' }}>
                            ({questions.length})
                          </span>
                        </div>

                        {/* Bulleted List: Single or Multi-bullet */}
                        <ul
                          style={{
                            margin: 0,
                            paddingLeft: '18px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            listStyleType: 'disc'
                          }}
                        >
                          {questions.map((q, idx) => (
                            <li
                              key={idx}
                              style={{
                                fontSize: 'var(--type-table-row-size, 12.5px)',
                                fontWeight: 400,
                                color: '#334155',
                                lineHeight: 1.55
                              }}
                            >
                              {q.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Category Group 4: Review Comments (Clean Unboxed Bullet List) */}
                    {comments.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {/* Group Title: Matching Engagement Name Properties */}
                        <div
                          className="type-studio-title"
                          style={{
                            fontSize: 'var(--type-studio-title-size, 15px)',
                            fontWeight: 500,
                            color: 'var(--type-studio-title-color, #334155)',
                            lineHeight: 'var(--type-studio-title-leading, 1.3)' as any,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <span>Review Comments</span>
                          <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748B' }}>
                            ({comments.length})
                          </span>
                        </div>

                        {/* Bulleted List: Single or Multi-bullet */}
                        <ul
                          style={{
                            margin: 0,
                            paddingLeft: '18px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            listStyleType: 'disc'
                          }}
                        >
                          {comments.map((c, idx) => (
                            <li
                              key={idx}
                              style={{
                                fontSize: 'var(--type-table-row-size, 12.5px)',
                                fontWeight: 400,
                                color: '#334155',
                                lineHeight: 1.55
                              }}
                            >
                              {c.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Category Group 5: Improvement Recommendations (Clean Unboxed Bullet List) */}
                    {improvements.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {/* Group Title: Matching Engagement Name Properties */}
                        <div
                          className="type-studio-title"
                          style={{
                            fontSize: 'var(--type-studio-title-size, 15px)',
                            fontWeight: 500,
                            color: 'var(--type-studio-title-color, #334155)',
                            lineHeight: 'var(--type-studio-title-leading, 1.3)' as any,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <span>Improvement Recommendations</span>
                          <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748B' }}>
                            ({improvements.length})
                          </span>
                        </div>

                        {/* Bulleted List: Single or Multi-bullet */}
                        <ul
                          style={{
                            margin: 0,
                            paddingLeft: '18px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            listStyleType: 'disc'
                          }}
                        >
                          {improvements.map((r, idx) => (
                            <li
                              key={idx}
                              style={{
                                fontSize: 'var(--type-table-row-size, 12.5px)',
                                fontWeight: 400,
                                color: '#334155',
                                lineHeight: 1.55
                              }}
                            >
                              {r.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* Category Group 6: Strengths (Clean Unboxed Bullet List) */}
                    {strengths.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        {/* Group Title: Matching Engagement Name Properties */}
                        <div
                          className="type-studio-title"
                          style={{
                            fontSize: 'var(--type-studio-title-size, 15px)',
                            fontWeight: 500,
                            color: 'var(--type-studio-title-color, #334155)',
                            lineHeight: 'var(--type-studio-title-leading, 1.3)' as any,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px'
                          }}
                        >
                          <span>Strengths</span>
                          <span style={{ fontSize: '11px', fontWeight: 500, color: '#64748B' }}>
                            ({strengths.length})
                          </span>
                        </div>

                        {/* Bulleted List: Single or Multi-bullet */}
                        <ul
                          style={{
                            margin: 0,
                            paddingLeft: '18px',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '6px',
                            listStyleType: 'disc'
                          }}
                        >
                          {strengths.map((s, idx) => (
                            <li
                              key={idx}
                              style={{
                                fontSize: 'var(--type-table-row-size, 12.5px)',
                                fontWeight: 400,
                                color: '#334155',
                                lineHeight: 1.55
                              }}
                            >
                              {s.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </Drawer>
  );
};

export default GuidelinesDrawer;
