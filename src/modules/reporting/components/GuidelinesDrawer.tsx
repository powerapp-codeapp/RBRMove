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
          style: {
            width: 'clamp(560px, 50vw, 820px)',
            maxWidth: '95vw',
            height: '100%',
            backgroundColor: '#FAFAFA',
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
      {/* Header */}
      <div
        style={{
          backgroundColor: '#000099',
          color: '#FFFFFF',
          padding: '16px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <BookOpen size={18} color="#FFFFFF" />
          <div>
            <div style={{ fontSize: '15px', fontWeight: 700, color: '#FFFFFF' }}>
              Show Guidelines
            </div>
            <div style={{ fontSize: '11.5px', color: 'rgba(255, 255, 255, 0.85)' }}>
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
            color: '#FFFFFF',
            cursor: 'pointer',
            padding: '4px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px'
          }}
          title="Close guidelines"
        >
          <X size={18} />
        </button>
      </div>

      {/* Sub-header Controls */}
      <div
        style={{
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E5E7EB',
          padding: '10px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0
        }}
      >
        <span style={{ fontSize: '12px', fontWeight: 600, color: '#4B5563' }}>
          Applicable Guidelines ({totalItems} items across {activeFields.length} fields)
        </span>

        <button
          type="button"
          onClick={allExpanded ? handleCollapseAll : handleExpandAll}
          style={{
            background: '#F3F4F6',
            border: '1px solid #D1D5DB',
            borderRadius: '4px',
            padding: '4px 10px',
            fontSize: '11.5px',
            fontWeight: 600,
            color: '#374151',
            cursor: 'pointer',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px'
          }}
        >
          <ChevronsUpDown size={12} />
          <span>{allExpanded ? 'Collapse All' : 'Expand All'}</span>
        </button>
      </div>

      {/* Drawer Body: Field-Wise Accordions */}
      <div
        className="slim-light-scrollbar"
        style={{
          flex: '1 1 auto',
          minHeight: 0,
          overflowY: 'auto',
          padding: '16px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        {activeFields.length === 0 ? (
          <div style={{ padding: '30px', textAlign: 'center', color: '#6B7280', fontSize: '13px' }}>
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
                  overflow: 'hidden',
                  flexShrink: 0
                }}
              >
                {/* Accordion Header (Simple & Clean) */}
                <div
                  onClick={() => toggleField(fieldKey)}
                  style={{
                    padding: '12px 16px',
                    backgroundColor: isExpanded ? '#F9FAFB' : '#FFFFFF',
                    borderBottom: isExpanded ? '1px solid #E5E7EB' : 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    userSelect: 'none'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div
                      style={{
                        transform: isExpanded ? 'rotate(0deg)' : 'rotate(-90deg)',
                        transition: 'transform 0.15s ease',
                        display: 'flex',
                        alignItems: 'center',
                        color: '#000099'
                      }}
                    >
                      <ChevronDown size={16} />
                    </div>

                    <span style={{ fontSize: '13.5px', fontWeight: 700, color: '#111827' }}>
                      {displayName}
                    </span>
                  </div>

                  <span style={{ fontSize: '11.5px', color: '#6B7280' }}>
                    ({fieldTotal} {fieldTotal === 1 ? 'item' : 'items'})
                  </span>
                </div>

                {/* Accordion Content: Category information (Label & text one beneath the other) */}
                {isExpanded && (
                  <div
                    style={{
                      padding: '16px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '18px'
                    }}
                  >
                    {/* 1. PEF Violations */}
                    {violations.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#212121', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                          PEF Violations ({violations.length})
                        </div>

                        {violations.map((v, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '10px 14px',
                              border: '1px solid #D8D8D8',
                              borderRadius: '4px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                              fontSize: '12.5px',
                              color: '#212121',
                              lineHeight: 1.5
                            }}
                          >
                            <div>
                              <strong style={{ fontWeight: 700 }}>Guideline: </strong>
                              <span style={{ fontWeight: 400 }}>{v.guideline}</span>
                            </div>

                            {v.evidence_quote && (
                              <div>
                                <strong style={{ fontWeight: 700 }}>Evidence Quote: </strong>
                                <span style={{ fontWeight: 400 }}>"{v.evidence_quote}"</span>
                              </div>
                            )}

                            <div>
                              <strong style={{ fontWeight: 700 }}>Reason: </strong>
                              <span style={{ fontWeight: 400 }}>{v.reason}</span>
                            </div>

                            {v.suggestion && (
                              <div>
                                <strong style={{ fontWeight: 700 }}>Suggestion: </strong>
                                <span style={{ fontWeight: 400 }}>{v.suggestion}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 2. Undefined Acronyms */}
                    {acronyms.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#212121', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                          Undefined Acronyms ({acronyms.length})
                        </div>

                        {acronyms.map((ac, idx) => (
                          <div
                            key={idx}
                            style={{
                              padding: '10px 14px',
                              border: '1px solid #D8D8D8',
                              borderRadius: '4px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                              fontSize: '12.5px',
                              color: '#212121',
                              lineHeight: 1.5
                            }}
                          >
                            <div>
                              <strong style={{ fontWeight: 700 }}>Acronym: </strong>
                              <span style={{ fontWeight: 400 }}>{ac.acronym}</span>
                            </div>

                            {ac.suggested_definition && (
                              <div>
                                <strong style={{ fontWeight: 700 }}>Suggested Definition: </strong>
                                <span style={{ fontWeight: 400 }}>{ac.suggested_definition}</span>
                              </div>
                            )}

                            {ac.evidence_quote && (
                              <div>
                                <strong style={{ fontWeight: 700 }}>Evidence Quote: </strong>
                                <span style={{ fontWeight: 400 }}>"{ac.evidence_quote}"</span>
                              </div>
                            )}

                            {ac.comment && (
                              <div>
                                <strong style={{ fontWeight: 700 }}>Comment: </strong>
                                <span style={{ fontWeight: 400 }}>{ac.comment}</span>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* 3. Clarifying Questions */}
                    {questions.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#212121', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                          Clarifying Questions ({questions.length})
                        </div>

                        <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {questions.map((q, idx) => (
                            <li key={idx} style={{ fontSize: '12.5px', color: '#212121', lineHeight: 1.5, fontWeight: 400 }}>
                              {q.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 4. Review Comments */}
                    {comments.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#212121', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                          Review Comments ({comments.length})
                        </div>

                        <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {comments.map((c, idx) => (
                            <li key={idx} style={{ fontSize: '12.5px', color: '#212121', lineHeight: 1.5, fontWeight: 400 }}>
                              {c.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 5. Improvement Recommendations */}
                    {improvements.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#212121', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                          Improvement Recommendations ({improvements.length})
                        </div>

                        <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {improvements.map((r, idx) => (
                            <li key={idx} style={{ fontSize: '12.5px', color: '#212121', lineHeight: 1.5, fontWeight: 400 }}>
                              {r.text}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* 6. Strengths */}
                    {strengths.length > 0 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ fontSize: '13px', fontWeight: 700, color: '#212121', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
                          Strengths ({strengths.length})
                        </div>

                        <ul style={{ margin: 0, paddingLeft: '18px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          {strengths.map((s, idx) => (
                            <li key={idx} style={{ fontSize: '12.5px', color: '#212121', lineHeight: 1.5, fontWeight: 400 }}>
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
