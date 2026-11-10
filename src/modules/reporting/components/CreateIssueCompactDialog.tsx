import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { Sparkles, Plus, X, Cpu, Layers, ChevronUp, ChevronDown } from 'lucide-react';
import {
  SharedSelect,
  SharedFieldLabel,
  SharedButton,
  SharedTextArea,
  SharedTooltip,
} from '../../../components/shared';
import {
  IssueAdditionalFieldsSection,
  type IssueAdditionalFieldsState,
} from './IssueAdditionalFieldsSection';

export interface TestProcedureOption {
  value: string;
  label: string;
  function: string;
  id?: string;
}

export interface CreateIssueCompactDialogProps {
  open: boolean;
  onClose: () => void;
  resolvedEngagementName: string;
  testProcedure: string;
  onTestProcedureChange: (val: string) => void;
  testProcedureOptions: TestProcedureOption[];
  selectedFunction: 'IT' | 'FinOps';
  onFunctionChange: (func: 'IT' | 'FinOps') => void;
  originalIssue: string;
  onOriginalIssueChange: (val: string) => void;
  isAdditionalOpen: boolean;
  onToggleAdditional: () => void;
  additionalFieldsState: IssueAdditionalFieldsState;
  isAiLoading: boolean;
  onGenerateAi: () => void;
}

export const CreateIssueCompactDialog: React.FC<CreateIssueCompactDialogProps> = ({
  open,
  onClose,
  resolvedEngagementName,
  testProcedure,
  onTestProcedureChange,
  testProcedureOptions,
  selectedFunction,
  onFunctionChange,
  originalIssue,
  onOriginalIssueChange,
  isAdditionalOpen,
  onToggleAdditional,
  additionalFieldsState,
  isAiLoading,
  onGenerateAi,
}) => {
  return (
    <Dialog
      open={open}
      onClose={(_event, reason) => {
        if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
      }}
      maxWidth="md"
      fullWidth
      sx={{
        '& .MuiDialog-paper': {
          width: 'clamp(540px, 72vw, 820px)',
          maxWidth: '94vw',
          height: 'clamp(460px, 76vh, 720px)',
          minHeight: '420px',
          maxHeight: '90vh',
          borderRadius: '8px',
          backgroundColor: '#FFFFFF',
          overflow: 'hidden',
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
        },
      }}
    >
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 }}>
        {/* Loader Overlay during AI Generation */}
        {isAiLoading && (
          <div
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 200,
              backgroundColor: 'rgba(255, 255, 255, 0.94)',
              backdropFilter: 'blur(3px)',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '14px',
              padding: '24px',
              textAlign: 'center',
              borderRadius: '8px',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                backgroundColor: '#EFF6FF',
                border: '1.5px solid #BFDBFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000099',
                boxShadow: '0 4px 12px rgba(0, 0, 153, 0.08)',
              }}
            >
              <Sparkles size={22} className="spin" style={{ animation: 'spin 2s linear infinite' }} />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#0F172A', marginBottom: '4px' }}>
                Generating Audit Finding with AI...
              </div>
              <div style={{ fontSize: '12px', color: '#64748B', maxWidth: '380px', lineHeight: 1.4 }}>
                Synthesizing observation notes, testing scope, regulatory citations, root cause analysis, and policy standards...
              </div>
            </div>
          </div>
        )}

        {/* Dialog Header */}
        <DialogTitle
          sx={{
            p: '18px 24px',
            borderBottom: '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            flexShrink: 0,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '9px' }}>
              <div
                style={{
                  width: '28px',
                  height: '28px',
                  borderRadius: '5px',
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000099',
                }}
              >
                <Plus size={16} strokeWidth={2.5} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0px' }}>
                <h2 style={{ fontSize: '14.5px', fontWeight: 800, color: '#0F172A', margin: 0, lineHeight: 1.25 }}>
                  Add Audit Finding
                </h2>
                <span style={{ fontSize: '11px', color: '#64748B', fontWeight: 600, lineHeight: 1.25 }}>
                  {resolvedEngagementName}
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close dialog"
              style={{
                border: 'none',
                background: 'transparent',
                cursor: 'pointer',
                color: '#64748B',
                padding: '4px',
                borderRadius: '4px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: '28px',
                height: '28px',
                transition: 'all 0.15s ease',
              }}
              title="Close"
            >
              <X size={17} />
            </button>
          </div>
        </DialogTitle>

        {/* Dialog Content */}
        <DialogContent
          className="slim-light-scrollbar"
          sx={{
            flex: 1,
            minHeight: 0,
            px: '24px',
            pt: '20px !important',
            pb: '20px',
            backgroundColor: '#FFFFFF',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', paddingTop: '2px' }}>
            {/* Stage 1 Row 1: Test Procedure (col 1) & Function (col 2) */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '16px', alignItems: 'flex-start' }}>
              <div>
                <SharedSelect
                  label="Test Procedure"
                  value={testProcedure}
                  onChange={(val) => onTestProcedureChange(val as string)}
                  options={testProcedureOptions.map((opt) => ({
                    value: opt.value,
                    label: opt.label,
                  }))}
                  required
                />
              </div>

              <div>
                <SharedFieldLabel label="Function" required />
                <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                  <SharedButton
                    type="button"
                    variant={selectedFunction === 'IT' ? 'primary' : 'outline'}
                    size="small"
                    startIcon={<Cpu size={14} />}
                    onClick={() => onFunctionChange('IT')}
                    style={{
                      flex: 1,
                      height: '36px',
                      fontSize: '12px',
                      fontWeight: 700,
                      backgroundColor: selectedFunction === 'IT' ? '#EFF6FF' : '#FFFFFF',
                      color: selectedFunction === 'IT' ? '#000099' : '#475569',
                      borderColor: selectedFunction === 'IT' ? '#000099' : '#CBD5E1',
                    }}
                  >
                    IT
                  </SharedButton>

                  <SharedButton
                    type="button"
                    variant={selectedFunction === 'FinOps' ? 'primary' : 'outline'}
                    size="small"
                    startIcon={<Layers size={14} />}
                    onClick={() => onFunctionChange('FinOps')}
                    style={{
                      flex: 1,
                      height: '36px',
                      fontSize: '12px',
                      fontWeight: 700,
                      backgroundColor: selectedFunction === 'FinOps' ? '#EFF6FF' : '#FFFFFF',
                      color: selectedFunction === 'FinOps' ? '#000099' : '#475569',
                      borderColor: selectedFunction === 'FinOps' ? '#000099' : '#CBD5E1',
                    }}
                  >
                    FinOps
                  </SharedButton>
                </div>
              </div>
            </div>

            {/* Stage 1 Row 2: Original Issue (Multiline Textarea) */}
            <div>
              <SharedTextArea
                label="Original Issue"
                value={originalIssue}
                onChange={onOriginalIssueChange}
                placeholder="Enter observation notes, sampled exceptions, or discovered variance..."
                rows={4}
                required
                showCharCount
                maxLength={1600}
              />
            </div>

            {/* Toggle: "Additional Fields" Collapsible Section */}
            <div style={{ paddingTop: '2px' }}>
              <button
                type="button"
                onClick={onToggleAdditional}
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '4px 0',
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  color: '#000099',
                  fontSize: '12.5px',
                  fontWeight: 700,
                  fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
                }}
              >
                <span>Additional Fields</span>
                {isAdditionalOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </button>
            </div>

            {/* Collapsed Fields Section */}
            {isAdditionalOpen && (
              <IssueAdditionalFieldsSection state={additionalFieldsState} isNested={false} />
            )}
          </div>

          <div style={{ flex: 1, minHeight: '24px' }} />
        </DialogContent>

        {/* Dialog Footer Actions */}
        <DialogActions
          sx={{
            p: '12px 24px',
            borderTop: '1px solid #E2E8F0',
            backgroundColor: '#FFFFFF',
            flexShrink: 0,
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <SharedButton variant="outline" onClick={onClose}>
            Cancel
          </SharedButton>

          <SharedTooltip
            title="Uses generative AI to automatically synthesize the finding title, detailed description, root cause, impact, recommendations, and compliance references from the selected test procedure and original issue notes."
            placement="top"
          >
            <SharedButton
              variant="primary"
              startIcon={<Sparkles size={15} />}
              onClick={onGenerateAi}
              disabled={!originalIssue.trim() || !testProcedure || isAiLoading}
            >
              Generate with AI
            </SharedButton>
          </SharedTooltip>
        </DialogActions>
      </div>
    </Dialog>
  );
};

export default CreateIssueCompactDialog;

