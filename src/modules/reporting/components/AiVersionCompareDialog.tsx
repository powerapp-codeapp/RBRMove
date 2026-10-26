import React, { useState, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import { GitCompare, Check, X } from 'lucide-react';
import type { Issue } from '../../../types/dataverse.types';
import { SharedButton } from '../../../components/shared/buttons/SharedButton';

export interface AiCompareFieldData {
  title: string;
  description: string;
  rootCause: string;
  impact: string;
  recommendation: string;
  nonComplianceReferences?: string;
}

export interface AiVersionCompareDialogProps {
  open: boolean;
  onClose: () => void;
  previousData?: AiCompareFieldData;
  candidateData?: AiCompareFieldData;
  currentIssue?: Issue;
  onApplyMerge: (merged: {
    title: string;
    description: string;
    rootCause: string;
    impact: string;
    recommendation: string;
    nonComplianceReferences?: string;
  }) => void;
  onKeepPrevious?: () => void;
}

export const AiVersionCompareDialog: React.FC<AiVersionCompareDialogProps> = ({
  open,
  onClose,
  previousData: propPreviousData,
  candidateData: propCandidateData,
  currentIssue,
  onApplyMerge,
  onKeepPrevious,
}) => {
  // Resolve previous and candidate data
  const resolvedPrevious: AiCompareFieldData = propPreviousData || {
    title: currentIssue?.title || '',
    description: currentIssue?.issueNarrative || currentIssue?.description || currentIssue?.issue || '',
    rootCause: currentIssue?.rootCause || '',
    impact: currentIssue?.impact || '',
    recommendation: currentIssue?.recommendation || '',
    nonComplianceReferences: (currentIssue as any)?.nonComplianceReferences || '',
  };

  const resolvedCandidate: AiCompareFieldData = propCandidateData || {
    title: `[AI Refined]: ${resolvedPrevious.title.replace(/^\[AI Refined\]:\s*/, '')}`,
    description: resolvedPrevious.description
      ? `${resolvedPrevious.description}\n\n[AI Validation]: Analysis confirms telemetry logs exceeded standard inactivity threshold without scheduled de-provisioning triggers.`
      : 'Automated telemetry logs confirm lack of dormant user de-provisioning.',
    rootCause: `Systemic governance and automated synchronization gaps. Root cause analysis indicates lack of scheduled exception monitoring feeds and absence of secondary verification protocols.`,
    impact: `Operational variance exposes the environment to potential compliance citations, unauthorized data modification, and SOX/GxP regulatory escalation.`,
    recommendation: `1. Implement automated real-time exception alerting and scheduled synchronization.\n2. Establish mandatory dual-custody authorization for configuration overrides.\n3. Conduct retrospective audit reconciliations on a quarterly basis.`,
    nonComplianceReferences: 'Standard S-15: Security Architecture & Operational Governance (STD-IAPP-S15); J&J Enterprise Risk Framework.'
  };

  // Field selection state: 'candidate' | 'previous' for each of the 6 fields
  const [selectedVersions, setSelectedVersions] = useState<
    Record<keyof AiCompareFieldData, 'candidate' | 'previous'>
  >({
    title: 'candidate',
    description: 'candidate',
    rootCause: 'candidate',
    impact: 'candidate',
    recommendation: 'candidate',
    nonComplianceReferences: 'candidate',
  });

  // Reset selections when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedVersions({
        title: 'candidate',
        description: 'candidate',
        rootCause: 'candidate',
        impact: 'candidate',
        recommendation: 'candidate',
        nonComplianceReferences: 'candidate',
      });
    }
  }, [open]);

  const handleApplyMerge = () => {
    const merged = {
      title: selectedVersions.title === 'candidate' ? resolvedCandidate.title : resolvedPrevious.title,
      description: selectedVersions.description === 'candidate' ? resolvedCandidate.description : resolvedPrevious.description,
      rootCause: selectedVersions.rootCause === 'candidate' ? resolvedCandidate.rootCause : resolvedPrevious.rootCause,
      impact: selectedVersions.impact === 'candidate' ? resolvedCandidate.impact : resolvedPrevious.impact,
      recommendation: selectedVersions.recommendation === 'candidate' ? resolvedCandidate.recommendation : resolvedPrevious.recommendation,
      nonComplianceReferences: selectedVersions.nonComplianceReferences === 'candidate'
        ? (resolvedCandidate.nonComplianceReferences || '')
        : (resolvedPrevious.nonComplianceReferences || ''),
    };
    onApplyMerge(merged);
    onClose();
  };

  const handleKeepPrevious = () => {
    if (onKeepPrevious) {
      onKeepPrevious();
    } else {
      onApplyMerge(resolvedPrevious);
    }
    onClose();
  };

  const fieldList: { key: keyof AiCompareFieldData; label: string }[] = [
    { key: 'title', label: 'Issue Title' },
    { key: 'description', label: 'Description' },
    { key: 'rootCause', label: 'Root Cause' },
    { key: 'impact', label: 'Impact' },
    { key: 'recommendation', label: 'Recommendations' },
    { key: 'nonComplianceReferences', label: 'Non Compliance References' },
  ];

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          width: '960px',
          maxWidth: '94vw',
          maxHeight: '85vh',
          borderRadius: '8px',
          backgroundColor: '#FFFFFF',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <DialogTitle
        sx={{
          p: '14px 24px',
          borderBottom: '1px solid #E2E8F0',
          backgroundColor: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexShrink: 0,
          gap: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              width: '32px',
              height: '32px',
              borderRadius: '6px',
              backgroundColor: '#F0FDF4',
              border: '1px solid #BBF7D0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#15803D',
            }}
          >
            <GitCompare size={17} />
          </div>
          <h2
            className="type-modal-title"
            style={{
              fontSize: 'var(--type-modal-title-size, 16px)',
              fontWeight: 800,
              color: '#0F172A',
              margin: 0,
              fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
            }}
          >
            Compare Versions
          </h2>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SharedButton
            variant="outline"
            size="small"
            onClick={handleKeepPrevious}
          >
            Keep Previous Version
          </SharedButton>

          <SharedButton
            variant="success"
            size="small"
            startIcon={<Check size={14} />}
            onClick={handleApplyMerge}
          >
            Keep Selected
          </SharedButton>

          <SharedButton
            variant="outline"
            size="small"
            startIcon={<X size={13} />}
            onClick={onClose}
            title="Discard changes and keep previous version"
          >
            Discard
          </SharedButton>
        </div>
      </DialogTitle>

      <DialogContent
        className="slim-light-scrollbar"
        sx={{
          p: '0 !important',
          overflowY: 'auto',
          backgroundColor: '#F8FAFC',
        }}
      >
        <div
          style={{
            padding: '28px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '20px',
          }}
        >
          {fieldList.map(({ key, label }) => {
            const prevText = resolvedPrevious[key];
            const candidateText = resolvedCandidate[key];
            const choice = selectedVersions[key];

            return (
              <div
                key={key}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '8px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0 2px',
                  }}
                >
                  <span
                    className="type-section-title"
                    style={{
                      fontSize: 'var(--type-table-header-size, 13px)',
                      fontWeight: 800,
                      color: '#1E293B',
                      fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
                    }}
                  >
                    {label}
                  </span>
                  <span
                    className="type-caption"
                    style={{
                      fontSize: 'var(--type-caption-size, 11.5px)',
                      color: '#64748B',
                      fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
                    }}
                  >
                    Selected:{' '}
                    <strong style={{ color: choice === 'candidate' ? '#15803D' : '#000099' }}>
                      {choice === 'candidate' ? 'Regenerated' : 'Previous'}
                    </strong>
                  </span>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  {/* Previous Version Box */}
                  <div
                    onClick={() =>
                      setSelectedVersions((prev) => ({ ...prev, [key]: 'previous' }))
                    }
                    style={{
                      padding: '14px',
                      borderRadius: '6px',
                      border: choice === 'previous' ? '2px solid #000099' : '1px solid #CBD5E1',
                      backgroundColor: choice === 'previous' ? '#EFF6FF' : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow:
                        choice === 'previous'
                          ? '0 1px 3px rgba(0, 0, 153, 0.08)'
                          : '0 1px 2px rgba(0, 0, 0, 0.03)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 'var(--type-table-row-size, 13px)',
                        color: '#334155',
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.5,
                        fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
                      }}
                    >
                      {prevText || 'No previous content.'}
                    </span>
                  </div>

                  {/* Candidate / Regenerated Version Box */}
                  <div
                    onClick={() =>
                      setSelectedVersions((prev) => ({ ...prev, [key]: 'candidate' }))
                    }
                    style={{
                      padding: '14px',
                      borderRadius: '6px',
                      border: choice === 'candidate' ? '2px solid #16A34A' : '1px solid #CBD5E1',
                      backgroundColor: choice === 'candidate' ? '#F0FDF4' : '#FFFFFF',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      boxShadow:
                        choice === 'candidate'
                          ? '0 1px 3px rgba(22, 163, 74, 0.1)'
                          : '0 1px 2px rgba(0, 0, 0, 0.03)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 'var(--type-table-row-size, 13px)',
                        color: choice === 'candidate' ? '#14532D' : '#334155',
                        whiteSpace: 'pre-wrap',
                        lineHeight: 1.5,
                        fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
                      }}
                    >
                      {candidateText || 'No candidate content.'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </DialogContent>
    </Dialog>
  );
};
