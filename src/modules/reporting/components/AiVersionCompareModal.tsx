import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import { GitCompare, Check, X } from 'lucide-react';
import { SharedButton } from '../../../components/shared';

export interface AiFields {
  updatedIssueHeader: string;
  description: string;
  rootCause: string;
  impact: string;
  recommendation: string;
  nonComplianceReferences: string;
}

export interface AiVersionCompareModalProps {
  open: boolean;
  currentVersionNumber: number;
  previousAiData: AiFields | null;
  candidateAiData: AiFields | null;
  selectedComparisonVersions: Record<keyof AiFields, 'candidate' | 'previous'>;
  onSelectVersion: (field: keyof AiFields, version: 'candidate' | 'previous') => void;
  onEditPreviousField: (field: keyof AiFields, value: string) => void;
  onEditCandidateField: (field: keyof AiFields, value: string) => void;
  onKeepPrevious: () => void;
  onKeepSelected: () => void;
  onDiscard: () => void;
}

const COMPARISON_FIELD_CONFIG: Array<{
  key: keyof AiFields;
  label: string;
  rows: number;
}> = [
  { key: 'updatedIssueHeader', label: 'Issue Title', rows: 2 },
  { key: 'description', label: 'Description', rows: 4 },
  { key: 'rootCause', label: 'Root Cause', rows: 3 },
  { key: 'impact', label: 'Impact & Exposure', rows: 3 },
  { key: 'recommendation', label: 'Recommendations', rows: 3 },
  { key: 'nonComplianceReferences', label: 'References', rows: 3 },
];

export const AiVersionCompareModal: React.FC<AiVersionCompareModalProps> = ({
  open,
  currentVersionNumber,
  previousAiData,
  candidateAiData,
  selectedComparisonVersions,
  onSelectVersion,
  onEditPreviousField,
  onEditCandidateField,
  onKeepPrevious,
  onKeepSelected,
  onDiscard,
}) => {
  return (
    <Dialog
      open={open}
      onClose={onDiscard}
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
          <div>
            <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
              Compare & Edit AI Versions (v{currentVersionNumber} vs Candidate v{currentVersionNumber + 1})
            </h2>
            <div style={{ fontSize: '11.5px', color: '#64748B', marginTop: '2px' }}>
              Select a version or edit text directly in either box before keeping your selection.
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SharedButton type="button" variant="outline" size="small" onClick={onKeepPrevious}>
            Keep Previous
          </SharedButton>

          <SharedButton
            type="button"
            variant="success"
            size="small"
            startIcon={<Check size={14} />}
            onClick={onKeepSelected}
          >
            Keep Selected
          </SharedButton>

          <SharedButton
            type="button"
            variant="outline"
            size="small"
            startIcon={<X size={13} />}
            onClick={onDiscard}
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
        <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {previousAiData && candidateAiData && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {/* Column Headers (Shown once above all rows) */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', padding: '0 2px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#334155' }}>
                  Previous Version (v{currentVersionNumber})
                </div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#15803D' }}>
                  Regenerated Candidate (v{currentVersionNumber + 1})
                </div>
              </div>

              {COMPARISON_FIELD_CONFIG.map(({ key, label, rows }) => {
                const prevText = previousAiData[key] || '';
                const candidateText = candidateAiData[key] || '';
                const choice = selectedComparisonVersions[key];

                return (
                  <div
                    key={key}
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '13px', fontWeight: 800, color: '#1E293B' }}>{label}</span>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                          Keeping:
                        </span>
                        <span
                          style={{
                            fontSize: '11px',
                            fontWeight: 700,
                            color: choice === 'candidate' ? '#15803D' : '#000099',
                            backgroundColor: choice === 'candidate' ? '#F0FDF4' : '#EFF6FF',
                            border: choice === 'candidate' ? '1px solid #BBF7D0' : '1px solid #BFDBFE',
                            padding: '2px 8px',
                            borderRadius: '4px',
                          }}
                        >
                          {choice === 'candidate' ? 'Regenerated' : 'Previous'}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                      {/* Previous Version Input Box */}
                      <textarea
                        value={prevText}
                        rows={rows}
                        onClick={() => onSelectVersion(key, 'previous')}
                        onFocus={() => onSelectVersion(key, 'previous')}
                        onChange={(e) => onEditPreviousField(key, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          fontSize: '12.5px',
                          lineHeight: 1.5,
                          color: choice === 'previous' ? '#1E293B' : '#475569',
                          backgroundColor: choice === 'previous' ? '#FFFFFF' : '#F8FAFC',
                          border: choice === 'previous' ? '2px solid #16A34A' : '1px solid #D8D8D8',
                          borderRadius: '6px',
                          fontFamily: 'inherit',
                          resize: 'vertical',
                          outline: 'none',
                          boxSizing: 'border-box',
                          boxShadow:
                            choice === 'previous'
                              ? '0 0 0 1px #16A34A, 0 1px 4px rgba(22, 163, 74, 0.12)'
                              : 'none',
                          transition: 'all 0.15s ease',
                          cursor: 'text',
                        }}
                        placeholder="Previous version..."
                      />

                      {/* Regenerated Candidate Input Box */}
                      <textarea
                        value={candidateText}
                        rows={rows}
                        onClick={() => onSelectVersion(key, 'candidate')}
                        onFocus={() => onSelectVersion(key, 'candidate')}
                        onChange={(e) => onEditCandidateField(key, e.target.value)}
                        style={{
                          width: '100%',
                          padding: '10px 12px',
                          fontSize: '12.5px',
                          lineHeight: 1.5,
                          color: choice === 'candidate' ? '#1E293B' : '#475569',
                          backgroundColor: choice === 'candidate' ? '#FFFFFF' : '#F8FAFC',
                          border: choice === 'candidate' ? '2px solid #16A34A' : '1px solid #D8D8D8',
                          borderRadius: '6px',
                          fontFamily: 'inherit',
                          resize: 'vertical',
                          outline: 'none',
                          boxSizing: 'border-box',
                          boxShadow:
                            choice === 'candidate'
                              ? '0 0 0 1px #16A34A, 0 1px 4px rgba(22, 163, 74, 0.12)'
                              : 'none',
                          transition: 'all 0.15s ease',
                          cursor: 'text',
                        }}
                        placeholder="Regenerated candidate..."
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AiVersionCompareModal;

