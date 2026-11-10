import React from 'react';
import {
  Cpu,
  Layers,
  ChevronUp,
  ChevronDown,
  BookOpen,
  Save,
  Send,
} from 'lucide-react';
import {
  PageHeader,
  SharedSelect,
  SharedFieldLabel,
  SharedTextArea,
  SharedButton,
  SharedTooltip,
  AIInput,
  ReferenceComponent,
} from '../../../components/shared';
import {
  IssueAdditionalFieldsSection,
  type IssueAdditionalFieldsState,
} from './IssueAdditionalFieldsSection';
import { AiRegenerationBanner } from './AiRegenerationBanner';
import type { AiFields } from './AiVersionCompareModal';
import type { TestProcedureOption } from './CreateIssueCompactDialog';

export interface CreateIssueStudioViewProps {
  resolvedEngagementName: string;
  onBack: () => void;
  onCancel: () => void;

  // Left column inputs
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

  // Right column AI fields
  isRegenerateActive: boolean;
  isAiLoading: boolean;
  onDismissRegenerateBanner: () => void;
  onRegenerateAi: () => void;
  aiData: AiFields;
  onAiFieldChange: (key: keyof AiFields, val: string) => void;
  fieldRemarks: Record<keyof AiFields, string>;
  onFieldRemarkChange: (key: keyof AiFields, val: string) => void;

  // Footer actions
  onOpenGuidelines: () => void;
  onSaveDraft: () => void;
  onSubmitFinding: () => void;
}

export const CreateIssueStudioView: React.FC<CreateIssueStudioViewProps> = ({
  resolvedEngagementName,
  onBack,
  onCancel,
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
  isRegenerateActive,
  isAiLoading,
  onDismissRegenerateBanner,
  onRegenerateAi,
  aiData,
  onAiFieldChange,
  fieldRemarks,
  onFieldRemarkChange,
  onOpenGuidelines,
  onSaveDraft,
  onSubmitFinding,
}) => {
  return (
    <div
      className="create-issue-studio-root"
      style={{
        position: 'fixed',
        top: 'var(--header-total-height, 71px)',
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: 'calc(100vh - var(--header-total-height, 71px))',
        zIndex: 990,
        backgroundColor: '#FFFFFF',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Standardized Studio Header Toolbar */}
      <PageHeader
        onBack={onBack}
        backTitle="Back"
        title={resolvedEngagementName || 'Engagement'}
      />

      {/* Studio Body: Two Column Split Layout */}
      <div
        style={{
          display: 'flex',
          flex: 1,
          minHeight: 0,
          overflow: 'hidden',
          backgroundColor: '#FFFFFF',
          position: 'relative',
        }}
      >
        {/* ------------------------------------------------------------------- */}
        {/* LEFT COLUMN: MANUAL ENTRY & ALL WORKPAPER CONTEXT                   */}
        {/* ------------------------------------------------------------------- */}
        <div
          className="slim-light-scrollbar"
          style={{
            flex: '0 0 50%',
            width: '50%',
            height: '100%',
            minHeight: 0,
            overflowY: 'auto',
            overflowX: 'hidden',
            backgroundColor: '#FFFFFF',
            borderRight: '1px solid #E2E8F0',
            boxSizing: 'border-box',
          }}
        >
          <div
            style={{
              padding: '24px 24px 40px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px',
            }}
          >
            {/* Row 1: Test Procedure & Function */}
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
                  <button
                    type="button"
                    onClick={() => onFunctionChange('IT')}
                    style={{
                      flex: 1,
                      height: '36px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: selectedFunction === 'IT' ? '1.5px solid #000099' : '1px solid #CBD5E1',
                      backgroundColor: selectedFunction === 'IT' ? '#EFF6FF' : '#FFFFFF',
                      color: selectedFunction === 'IT' ? '#000099' : '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Cpu size={14} />
                    <span>IT</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onFunctionChange('FinOps')}
                    style={{
                      flex: 1,
                      height: '36px',
                      borderRadius: '4px',
                      fontSize: '12px',
                      fontWeight: 700,
                      cursor: 'pointer',
                      border: selectedFunction === 'FinOps' ? '1.5px solid #000099' : '1px solid #CBD5E1',
                      backgroundColor: selectedFunction === 'FinOps' ? '#EFF6FF' : '#FFFFFF',
                      color: selectedFunction === 'FinOps' ? '#000099' : '#475569',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '6px',
                    }}
                  >
                    <Layers size={14} />
                    <span>FinOps</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Row 2: Original Issue (Multiline Textarea) */}
            <div>
              <SharedTextArea
                label="Original Issue"
                value={originalIssue}
                onChange={onOriginalIssueChange}
                placeholder="Enter observation notes, sampled exceptions, or discovered variance..."
                rows={4}
                required
                showCharCount
              />
            </div>

            {/* Collapsible Additional Fields Drawer */}
            <div
              style={{
                border: '1px solid #EAEAEA',
                borderRadius: '6px',
                backgroundColor: '#FAFAFA',
                overflow: 'hidden',
              }}
            >
              <button
                type="button"
                onClick={onToggleAdditional}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#334155',
                }}
              >
                <span>Additional Fields</span>
                {isAdditionalOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {isAdditionalOpen && (
                <div style={{ padding: '14px', borderTop: '1px solid #EAEAEA' }}>
                  <IssueAdditionalFieldsSection state={additionalFieldsState} isNested={true} />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ------------------------------------------------------------------- */}
        {/* RIGHT COLUMN: AI GENERATED FIELDS RECTANGULAR CONTAINER            */}
        {/* ------------------------------------------------------------------- */}
        <div
          style={{
            flex: '0 0 50%',
            width: '50%',
            height: '100%',
            minHeight: 0,
            overflow: 'hidden',
            backgroundColor: '#FFFFFF',
            padding: '20px 24px',
            boxSizing: 'border-box',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          <div
            style={{
              backgroundColor: '#F8F9FA',
              border: '1px solid #E2E8F0',
              borderRadius: '8px',
              boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              minHeight: 0,
              overflow: 'hidden',
            }}
          >
            {/* Scrollable Container for AI fields */}
            <div
              className="slim-light-scrollbar"
              style={{
                flex: 1,
                minHeight: 0,
                overflowY: 'auto',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              {/* Always-Visible Regeneration Container */}
              <AiRegenerationBanner
                isRegenerateActive={isRegenerateActive}
                isAiLoading={isAiLoading}
                onDismiss={onDismissRegenerateBanner}
                onRegenerate={onRegenerateAi}
              />

              {/* 6 Core AI Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Field 1: Issue Title */}
                <AIInput
                  label="Issue Title"
                  value={aiData.updatedIssueHeader}
                  onChange={(v) => onAiFieldChange('updatedIssueHeader', v)}
                  remark={fieldRemarks.updatedIssueHeader}
                  onRemarkChange={(r) => onFieldRemarkChange('updatedIssueHeader', r)}
                  rows={2}
                  required
                  isAiLoading={isAiLoading}
                  placeholder="AI generated finding headline..."
                />

                {/* Field 2: Description */}
                <AIInput
                  label="Description / Condition Narrative"
                  value={aiData.description}
                  onChange={(v) => onAiFieldChange('description', v)}
                  remark={fieldRemarks.description}
                  onRemarkChange={(r) => onFieldRemarkChange('description', r)}
                  rows={4}
                  required
                  isAiLoading={isAiLoading}
                  placeholder="Synthesized condition narrative and standard citations..."
                />

                {/* Field 3: Root Cause */}
                <AIInput
                  label="Root Cause"
                  value={aiData.rootCause}
                  onChange={(v) => onAiFieldChange('rootCause', v)}
                  remark={fieldRemarks.rootCause}
                  onRemarkChange={(r) => onFieldRemarkChange('rootCause', r)}
                  rows={3}
                  required
                  isAiLoading={isAiLoading}
                  placeholder="Underlying operational or technical root cause gap..."
                />

                {/* Field 4: Impact */}
                <AIInput
                  label="Impact & Exposure"
                  value={aiData.impact}
                  onChange={(v) => onAiFieldChange('impact', v)}
                  remark={fieldRemarks.impact}
                  onRemarkChange={(r) => onFieldRemarkChange('impact', r)}
                  rows={3}
                  required
                  isAiLoading={isAiLoading}
                  placeholder="Compliance, financial, or data integrity impact..."
                />

                {/* Field 5: Recommendations */}
                <AIInput
                  label="Recommendations"
                  value={aiData.recommendation}
                  onChange={(v) => onAiFieldChange('recommendation', v)}
                  remark={fieldRemarks.recommendation}
                  onRemarkChange={(r) => onFieldRemarkChange('recommendation', r)}
                  rows={3}
                  required
                  isAiLoading={isAiLoading}
                  placeholder="Numbered corrective action recommendations..."
                />

                {/* Field 6: References */}
                <ReferenceComponent
                  label="References"
                  value={aiData.nonComplianceReferences}
                  onChange={(v) => onAiFieldChange('nonComplianceReferences', v)}
                  required
                  isAiLoading={isAiLoading}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Studio Footer: Full-Width Fixed Bottom Bar */}
      <div
        style={{
          height: '56px',
          minHeight: '56px',
          backgroundColor: '#FFFFFF',
          borderTop: '1px solid #D8D8D8',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'flex-end',
          padding: '0 24px',
          gap: '12px',
          boxShadow: '0 -2px 6px rgba(0,0,0,0.04)',
          flexShrink: 0,
        }}
      >
        <SharedButton variant="outline" onClick={onCancel}>
          Cancel
        </SharedButton>

        <SharedTooltip title="View field-by-field drafting guidelines, PEF compliance, and acronym definitions" placement="top">
          <span>
            <SharedButton
              variant="outline"
              startIcon={<BookOpen size={14} />}
              onClick={onOpenGuidelines}
              style={{
                borderColor: '#000099',
                color: '#000099',
                fontWeight: 600,
              }}
            >
              AI POV
            </SharedButton>
          </span>
        </SharedTooltip>

        <SharedTooltip title="Save finding as draft in current reviewer tier" placement="top">
          <span>
            <SharedButton
              variant="outline"
              startIcon={<Save size={14} />}
              onClick={onSaveDraft}
              disabled={isAiLoading}
            >
              Save Draft
            </SharedButton>
          </span>
        </SharedTooltip>

        <SharedTooltip title="Advance finding to next review tier" placement="top">
          <span>
            <SharedButton
              variant="primary"
              startIcon={<Send size={14} />}
              onClick={onSubmitFinding}
              disabled={isAiLoading}
            >
              Submit Finding
            </SharedButton>
          </span>
        </SharedTooltip>
      </div>
    </div>
  );
};

export default CreateIssueStudioView;

