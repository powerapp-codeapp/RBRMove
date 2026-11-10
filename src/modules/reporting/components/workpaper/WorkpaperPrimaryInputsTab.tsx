import React from 'react';
import type { Issue } from '../../../../types/dataverse.types';
import { SharedSelect } from '../../../../components/shared/inputs/SharedSelect';
import { SharedTextArea } from '../../../../components/shared/inputs/SharedTextArea';

interface WorkpaperPrimaryInputsTabProps {
  issue: Issue;
  isFieldDisabled: boolean;
  testProcedureOptions: { value: string; label: string }[];
  onFieldChange: (field: keyof Issue, value: any) => void;
  renderCommentTrigger: (fieldKey: string, fieldLabel: string) => React.ReactNode;
}

export const WorkpaperPrimaryInputsTab: React.FC<WorkpaperPrimaryInputsTabProps> = ({
  issue,
  isFieldDisabled,
  testProcedureOptions,
  onFieldChange,
  renderCommentTrigger,
}) => {
  const currentProcValue = issue.testProcedureCode || (testProcedureOptions[0]?.value || 'TP-101');
  const resolvedProcOptions = testProcedureOptions.length > 0
    ? testProcedureOptions
    : [
      {
        value: currentProcValue,
        label: issue.testProcedureTitle
          ? `${currentProcValue}: ${issue.testProcedureTitle}`
          : currentProcValue,
      },
    ];

  const currentFunction = (issue.function || (issue.tech === 'FinOps' ? 'FinOps' : 'IT')) === 'FinOps'
    ? 'FinOps (Finance & Operations)'
    : 'IT (Information Technology)';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '20px',
        flexShrink: 0,
      }}
    >
      {/* Row 1: Test Procedure & Function */}
      <div
        className="two-col-field-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          columnGap: '24px',
          rowGap: '16px',
        }}
      >
        <SharedSelect
          label="Test Procedure"
          value={currentProcValue}
          onChange={(val) => onFieldChange('testProcedureCode', val)}
          options={resolvedProcOptions}
          required
          disabled={isFieldDisabled}
          extraHeaderActions={renderCommentTrigger('testProcedureCode', 'Test Procedure')}
        />

        <div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: '4px',
            }}
          >
            <span
              style={{
                fontSize: 'var(--type-table-header-size, 12px)',
                fontWeight: 700,
                color: '#212121',
              }}
            >
              Function <span style={{ color: '#eb1700' }}>*</span>
            </span>
            {renderCommentTrigger('function', 'Function')}
          </div>

          <div
            style={{
              minHeight: '38px',
              padding: '0 12px',
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#F8FAFC',
              border: '1px solid #D8D8D8',
              borderRadius: '4px',
              fontSize: '13px',
              color: '#212121',
              cursor: 'default',
            }}
          >
            <span style={{ fontWeight: 600 }}>{currentFunction}</span>
          </div>
        </div>
      </div>

      {/* Row 2: Original Issue */}
      <div>
        <SharedTextArea
          label="Original Issue"
          value={issue.originalIssue || issue.description || issue.title || ''}
          onChange={(val) => onFieldChange('originalIssue', val)}
          placeholder="Detail initial audit observations, test sample exceptions, and discovered control gaps..."
          rows={4}
          required
          disabled={isFieldDisabled}
          extraHeaderActions={renderCommentTrigger('originalIssue', 'Original Issue')}
        />
      </div>
    </div>
  );
};

