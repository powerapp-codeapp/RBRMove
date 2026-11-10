import React from 'react';
import { RotateCcw, AlertTriangle, BookOpen } from 'lucide-react';
import type { Issue } from '../../../../types/dataverse.types';
import { AIInput, ReferenceComponent } from '../../../../components/shared';
import { SharedButton } from '../../../../components/shared/buttons/SharedButton';

export interface FieldRemarksState {
  title: string;
  issueNarrative: string;
  rootCause: string;
  impact: string;
  recommendation: string;
}

interface WorkpaperAiFieldsTabProps {
  issue: Issue;
  isFieldDisabled: boolean;
  isRegenerateActive: boolean;
  isAiLoadingLocal: boolean;
  fieldRemarks: FieldRemarksState;
  onFieldChange: (field: keyof Issue, value: any) => void;
  onFieldRemarkChange: (field: keyof FieldRemarksState, remark: string) => void;
  onRegenerateAi: () => void;
  onDismissRegenerateBanner: () => void;
  onOpenGuidelinesDrawer: () => void;
  onAiRewriteField: (
    fieldKey: string,
    action: 'rewrite' | 'tone' | 'detailed' | 'shorter',
    selectedText?: string
  ) => Promise<string>;
  renderCommentTrigger: (fieldKey: string, fieldLabel: string) => React.ReactNode;
}

export const WorkpaperAiFieldsTab: React.FC<WorkpaperAiFieldsTabProps> = ({
  issue,
  isFieldDisabled,
  isRegenerateActive,
  isAiLoadingLocal,
  fieldRemarks,
  onFieldChange,
  onFieldRemarkChange,
  onRegenerateAi,
  onDismissRegenerateBanner,
  onOpenGuidelinesDrawer,
  onAiRewriteField,
  renderCommentTrigger,
}) => {
  return (
    <div
      style={{
        backgroundColor: '#FAFAFA',
        borderRadius: '8px',
        boxShadow: '0 1px 4px rgba(0, 0, 0, 0.06), 0 2px 8px rgba(0, 0, 0, 0.03)',
        overflow: 'visible',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        padding: '20px',
        gap: '16px',
      }}
    >
      {/* Top Row: Regenerate Container + AI POV Button */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          flexWrap: 'wrap',
        }}
      >
        {/* Always-Visible Regeneration Container */}
        <div
          style={{
            flex: 1,
            minWidth: '240px',
            backgroundColor: isRegenerateActive ? '#EFF6FF' : '#F8FAFC',
            border: isRegenerateActive ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
            borderRadius: '8px',
            padding: '8px 14px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '12px',
            boxShadow: isRegenerateActive ? '0 1px 3px rgba(0, 0, 153, 0.08)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1 }}>
            <div
              style={{
                width: '26px',
                height: '26px',
                borderRadius: '50%',
                backgroundColor: isRegenerateActive ? '#DBEAFE' : '#F1F5F9',
                border: isRegenerateActive ? '1px solid #93C5FD' : '1px solid #CBD5E1',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: isRegenerateActive ? '#000099' : '#94A3B8',
                flexShrink: 0,
              }}
            >
              {isRegenerateActive ? <AlertTriangle size={14} /> : <RotateCcw size={13} />}
            </div>
            <div>
              <div
                style={{
                  fontSize: '12.5px',
                  color: isRegenerateActive ? '#1E3A8A' : '#64748B',
                  lineHeight: 1.4,
                  fontWeight: isRegenerateActive ? 600 : 400,
                }}
              >
                {isRegenerateActive
                  ? 'Changed the original issue or function, so generated AI might not be aligned. Please click Regenerate AI if needed.'
                  : 'Change the function or original issue to regenerate'}
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
            {isRegenerateActive && (
              <SharedButton
                variant="outline"
                size="small"
                onClick={onDismissRegenerateBanner}
                style={{ minHeight: '1.75rem', fontSize: '11.5px', padding: '0 12px' }}
              >
                Cancel
              </SharedButton>
            )}

            <SharedButton
              variant={isRegenerateActive ? 'primary' : 'outline'}
              size="small"
              startIcon={<RotateCcw size={12} />}
              onClick={onRegenerateAi}
              disabled={!isRegenerateActive || isAiLoadingLocal || isFieldDisabled}
              loading={isAiLoadingLocal}
              style={
                !isRegenerateActive
                  ? {
                      opacity: 0.6,
                      borderColor: '#CBD5E1',
                      color: '#94A3B8',
                      cursor: 'not-allowed',
                      backgroundColor: '#F8FAFC',
                    }
                  : undefined
              }
            >
              {isAiLoadingLocal ? 'Regenerating...' : 'Regenerate AI'}
            </SharedButton>
          </div>
        </div>

        <SharedButton
          variant="outline"
          size="small"
          startIcon={<BookOpen size={13} />}
          onClick={onOpenGuidelinesDrawer}
          style={{
            borderColor: '#000099',
            color: '#000099',
            fontWeight: 600,
            backgroundColor: '#FFFFFF',
            minHeight: '42px',
            fontSize: '11.5px',
            padding: '0 14px',
            flexShrink: 0,
          }}
        >
          AI POV
        </SharedButton>
      </div>

      {/* Standard 6 AI Fields */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* 1. Issue Title */}
        <AIInput
          label="Issue Title"
          value={issue.title}
          onChange={(val) => onFieldChange('title', val)}
          remark={fieldRemarks.title}
          onRemarkChange={(r) => onFieldRemarkChange('title', r)}
          onAiRewrite={(action, selectedText) =>
            onAiRewriteField('Issue Title', action, selectedText || issue.title)
          }
          rows={2}
          required
          disabled={isFieldDisabled}
          isAiLoading={isAiLoadingLocal}
          placeholder="AI generated finding title..."
          inputBackgroundColor="#FFFFFF"
          extraHeaderActions={renderCommentTrigger('title', 'Issue Title')}
        />

        {/* 2. Issue Description */}
        <AIInput
          label="Issue Description"
          value={issue.issueNarrative || issue.description || issue.issue || ''}
          onChange={(val) => onFieldChange('issueNarrative', val)}
          remark={fieldRemarks.issueNarrative}
          onRemarkChange={(r) => onFieldRemarkChange('issueNarrative', r)}
          onAiRewrite={(action, selectedText) =>
            onAiRewriteField(
              'Description',
              action,
              selectedText || issue.issueNarrative || issue.description || issue.issue || ''
            )
          }
          rows={5}
          required
          disabled={isFieldDisabled}
          isAiLoading={isAiLoadingLocal}
          placeholder="AI synthesized condition narrative & standard citations..."
          inputBackgroundColor="#FFFFFF"
          extraHeaderActions={renderCommentTrigger('issueNarrative', 'Issue Description')}
        />

        {/* 3. Root Cause */}
        <AIInput
          label="Root Cause"
          value={issue.rootCause || ''}
          onChange={(val) => onFieldChange('rootCause', val)}
          remark={fieldRemarks.rootCause}
          onRemarkChange={(r) => onFieldRemarkChange('rootCause', r)}
          onAiRewrite={(action, selectedText) =>
            onAiRewriteField('Root Cause', action, selectedText || issue.rootCause || '')
          }
          rows={3}
          required
          disabled={isFieldDisabled}
          isAiLoading={isAiLoadingLocal}
          placeholder="Underlying operational or technical root cause gap..."
          inputBackgroundColor="#FFFFFF"
          extraHeaderActions={renderCommentTrigger('rootCause', 'Root Cause')}
        />

        {/* 4. Impact */}
        <AIInput
          label="Impact & Business Risk Exposure"
          value={issue.impact || ''}
          onChange={(val) => onFieldChange('impact', val)}
          remark={fieldRemarks.impact}
          onRemarkChange={(r) => onFieldRemarkChange('impact', r)}
          onAiRewrite={(action, selectedText) =>
            onAiRewriteField('Impact', action, selectedText || issue.impact || '')
          }
          rows={3}
          required
          disabled={isFieldDisabled}
          isAiLoading={isAiLoadingLocal}
          placeholder="Compliance, financial, or data integrity impact..."
          inputBackgroundColor="#FFFFFF"
          extraHeaderActions={renderCommentTrigger('impact', 'Impact & Business Risk Exposure')}
        />

        {/* 5. Recommendations */}
        <AIInput
          label="Recommendations"
          value={issue.recommendation || ''}
          onChange={(val) => onFieldChange('recommendation', val)}
          remark={fieldRemarks.recommendation}
          onRemarkChange={(r) => onFieldRemarkChange('recommendation', r)}
          onAiRewrite={(action, selectedText) =>
            onAiRewriteField('Recommendations', action, selectedText || issue.recommendation || '')
          }
          rows={4}
          required
          disabled={isFieldDisabled}
          isAiLoading={isAiLoadingLocal}
          placeholder="Numbered corrective actions and recommendations..."
          inputBackgroundColor="#FFFFFF"
          extraHeaderActions={renderCommentTrigger('recommendation', 'Recommendations')}
        />

        {/* 6. References */}
        <div
          style={{
            backgroundColor: '#FFFFFF',
            padding: '14px 16px',
            borderRadius: '8px',
            border: '1px solid #E2E8F0',
          }}
        >
          <ReferenceComponent
            label="References"
            value={issue.nonComplianceReferences || ''}
            onChange={(val) => onFieldChange('nonComplianceReferences', val)}
            disabled={isFieldDisabled}
            isAiLoading={isAiLoadingLocal}
            extraHeaderActions={renderCommentTrigger('nonComplianceReferences', 'References')}
          />
        </div>
      </div>
    </div>
  );
};

