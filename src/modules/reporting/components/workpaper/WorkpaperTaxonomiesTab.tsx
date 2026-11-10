import React from 'react';
import type { Issue, CriticalityLevel } from '../../../../types/dataverse.types';
import {
  SharedTextInput,
  SharedTextArea,
  SharedSelect,
  SharedMultiSelect,
  SharedCheckbox,
} from '../../../../components/shared';

const YES_NO_OPTIONS = [
  { value: 'No', label: 'No' },
  { value: 'Yes', label: 'Yes' },
];

interface WorkpaperTaxonomiesTabProps {
  issue: Issue;
  isFieldDisabled: boolean;
  criticalityOptions: { value: string; label: string }[];
  issueTypeOptions: { value: string; label: string }[];
  rootCauseTypeOptions: { value: string; label: string }[];
  issueSourceOptions: { value: string; label: string }[];
  keyThemeOptions: { value: string; label: string }[];
  processAreaOptions: { value: string; label: string }[];
  repeatFindingOptions: { value: string; label: string }[];
  itAssetAccountableSectorOptions: { value: string; label: string }[];
  accountableFunctionOptions: { value: string; label: string }[];
  impactedRegionOptions: { value: string; label: string }[];
  impactedSectorOptions: { value: string; label: string }[];
  impactedMrcOptions: { value: string; label: string }[];
  quarterImpactedOptions: { value: string; label: string }[];
  systemUsers: { value: string; label: string }[];
  onFieldChange: (field: keyof Issue, value: any) => void;
  renderCommentTrigger: (fieldKey: string, fieldLabel: string) => React.ReactNode;
}

export const WorkpaperTaxonomiesTab: React.FC<WorkpaperTaxonomiesTabProps> = ({
  issue,
  isFieldDisabled,
  criticalityOptions,
  issueTypeOptions,
  rootCauseTypeOptions,
  issueSourceOptions,
  keyThemeOptions,
  processAreaOptions,
  repeatFindingOptions,
  itAssetAccountableSectorOptions,
  accountableFunctionOptions,
  impactedRegionOptions,
  impactedSectorOptions,
  impactedMrcOptions,
  quarterImpactedOptions,
  systemUsers,
  onFieldChange,
  renderCommentTrigger,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        flexShrink: 0,
      }}
    >
      {/* 1. Summary Finding Executive Summary */}
      <SharedTextArea
        label="Summary Finding Executive Summary"
        value={issue.summaryFinding || ''}
        onChange={(val) => onFieldChange('summaryFinding', val)}
        placeholder="Brief executive summary narrative of finding..."
        rows={2}
        disabled={isFieldDisabled}
        extraHeaderActions={renderCommentTrigger('summaryFinding', 'Summary Finding Executive Summary')}
      />

      {/* 2. Auditor Response */}
      <SharedTextArea
        label="Auditor Response"
        value={issue.auditorResponse || ''}
        onChange={(val) => onFieldChange('auditorResponse', val)}
        placeholder="Auditor validation or initial assessment notes..."
        rows={2}
        disabled={isFieldDisabled}
        extraHeaderActions={renderCommentTrigger('auditorResponse', 'Auditor Response')}
      />

      {/* 3. Mitigating Control */}
      <SharedTextArea
        label="Mitigating Control"
        value={issue.mitigatingControl || issue.mitigatingControls || ''}
        onChange={(val) => {
          onFieldChange('mitigatingControl', val);
          onFieldChange('mitigatingControls', val);
        }}
        placeholder="Existing compensating controls in place..."
        rows={2}
        disabled={isFieldDisabled}
        extraHeaderActions={renderCommentTrigger('mitigatingControl', 'Mitigating Control')}
      />

      {/* 4. Exception Remediation Comments */}
      <SharedTextArea
        label="Exception Remediation Comments"
        value={issue.exceptionRemedComments || ''}
        onChange={(val) => onFieldChange('exceptionRemedComments', val)}
        placeholder="Remediation timeline comments..."
        rows={2}
        disabled={isFieldDisabled}
        extraHeaderActions={renderCommentTrigger('exceptionRemedComments', 'Exception Remediation Comments')}
      />

      {/* 5. Issue Type & 6. Issue Cause Type */}
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
          label="Issue Type"
          value={issue.issueType || ''}
          onChange={(val) => onFieldChange('issueType', val)}
          options={issueTypeOptions}
          placeholder="Select Issue Type..."
          disabled={isFieldDisabled}
          extraHeaderActions={renderCommentTrigger('issueType', 'Issue Type')}
        />
        <SharedSelect
          label="Issue Cause Type"
          value={issue.issueCauseType || issue.rootCauseType || ''}
          onChange={(val) => {
            onFieldChange('issueCauseType', val);
            onFieldChange('rootCauseType', val);
          }}
          options={rootCauseTypeOptions}
          placeholder="Select Issue Cause Type..."
          disabled={isFieldDisabled}
          extraHeaderActions={renderCommentTrigger('issueCauseType', 'Issue Cause Type')}
        />
      </div>

      {/* 7. Criticality & 8. SOX Reportable */}
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
          label="Criticality"
          value={issue.criticality || ''}
          onChange={(val) => onFieldChange('criticality', val as CriticalityLevel)}
          options={criticalityOptions}
          placeholder="Select Criticality..."
          required
          disabled={isFieldDisabled}
          extraHeaderActions={renderCommentTrigger('criticality', 'Criticality')}
        />
        <SharedSelect
          label="SOX Reportable"
          value={issue.soxReportable || (issue.criticality === 'Critical' ? 'Yes' : 'No')}
          onChange={(val) => onFieldChange('soxReportable', val)}
          options={YES_NO_OPTIONS}
          disabled={isFieldDisabled}
          extraHeaderActions={renderCommentTrigger('soxReportable', 'SOX Reportable')}
        />
      </div>

      {/* 9. Issue Finding Source & 10. Key Theme */}
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
          label="Issue Finding Source"
          value={issue.issueSource || ''}
          onChange={(val) => onFieldChange('issueSource', val)}
          options={issueSourceOptions}
          placeholder="Select Issue Source..."
          disabled={isFieldDisabled}
          extraHeaderActions={renderCommentTrigger('issueSource', 'Issue Finding Source')}
        />
        <SharedSelect
          label="Key Theme"
          value={issue.keyTheme || ''}
          onChange={(val) => onFieldChange('keyTheme', val)}
          options={keyThemeOptions}
          placeholder="Select Key Theme..."
          disabled={isFieldDisabled}
          extraHeaderActions={renderCommentTrigger('keyTheme', 'Key Theme')}
        />
      </div>

      {/* 11. Area & 12. Repeat Finding */}
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
          label="Area"
          value={issue.processArea || issue.accountableProcessArea || ''}
          onChange={(val) => {
            onFieldChange('processArea', val);
            onFieldChange('accountableProcessArea', val);
          }}
          options={processAreaOptions}
          placeholder="Select Area..."
          disabled={isFieldDisabled}
          extraHeaderActions={renderCommentTrigger('processArea', 'Area')}
        />
        <SharedSelect
          label="Repeat Finding"
          value={issue.repeatFinding || ''}
          onChange={(val) => onFieldChange('repeatFinding', val)}
          options={repeatFindingOptions.length > 0 ? repeatFindingOptions : YES_NO_OPTIONS}
          placeholder="Select Repeat Finding..."
          disabled={isFieldDisabled}
          extraHeaderActions={renderCommentTrigger('repeatFinding', 'Repeat Finding')}
        />
      </div>

      {/* 13. IT Asset Accountable Sector & 14. Accountable Function */}
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
          label="IT Asset Accountable Sector"
          value={issue.itAssetAccountableSector || ''}
          onChange={(val) => onFieldChange('itAssetAccountableSector', val)}
          options={itAssetAccountableSectorOptions}
          placeholder="Select Accountable Sector..."
          disabled={isFieldDisabled}
          extraHeaderActions={renderCommentTrigger('itAssetAccountableSector', 'IT Asset Accountable Sector')}
        />
        <SharedSelect
          label="Accountable Function"
          value={issue.accountableFunction || ''}
          onChange={(val) => onFieldChange('accountableFunction', val)}
          options={accountableFunctionOptions}
          placeholder="Select Accountable Function..."
          disabled={isFieldDisabled}
          extraHeaderActions={renderCommentTrigger('accountableFunction', 'Accountable Function')}
        />
      </div>

      {/* 15. Impacted Region & 16. Impacted Sector */}
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
          label="Impacted Region"
          value={issue.impactedRegion || ''}
          onChange={(val) => onFieldChange('impactedRegion', val)}
          options={impactedRegionOptions}
          placeholder="Select Region..."
          disabled={isFieldDisabled}
          extraHeaderActions={renderCommentTrigger('impactedRegion', 'Impacted Region')}
        />
        <SharedSelect
          label="Impacted Sector"
          value={issue.impactedSector || ''}
          onChange={(val) => onFieldChange('impactedSector', val)}
          options={impactedSectorOptions}
          placeholder="Select Sector..."
          disabled={isFieldDisabled}
          extraHeaderActions={renderCommentTrigger('impactedSector', 'Impacted Sector')}
        />
      </div>

      {/* 17. Impact MRC & 18. Quarter Impacted */}
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
          label="Impact MRC"
          value={issue.impactedMrc || ''}
          onChange={(val) => onFieldChange('impactedMrc', val)}
          options={impactedMrcOptions}
          placeholder="Select Impact MRC..."
          disabled={isFieldDisabled}
          extraHeaderActions={renderCommentTrigger('impactedMrc', 'Impact MRC')}
        />
        <SharedSelect
          label="Quarter Impacted"
          value={issue.quarterImpacted || ''}
          onChange={(val) => onFieldChange('quarterImpacted', val)}
          options={quarterImpactedOptions}
          placeholder="Select Quarter..."
          disabled={isFieldDisabled}
          extraHeaderActions={renderCommentTrigger('quarterImpacted', 'Quarter Impacted')}
        />
      </div>

      {/* 19. Sales (USD) & 20. IBT (USD) */}
      <div
        className="two-col-field-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          columnGap: '24px',
          rowGap: '16px',
        }}
      >
        <SharedTextInput
          label="Sales (USD)"
          value={issue.salesUsd != null ? String(issue.salesUsd) : ''}
          onChange={(val) => onFieldChange('salesUsd', val)}
          placeholder="$0.00"
          disabled={isFieldDisabled}
          extraHeaderActions={renderCommentTrigger('salesUsd', 'Sales (USD)')}
        />
        <SharedTextInput
          label="IBT (USD)"
          value={issue.ibtUsd != null ? String(issue.ibtUsd) : ''}
          onChange={(val) => onFieldChange('ibtUsd', val)}
          placeholder="$0.00"
          disabled={isFieldDisabled}
          extraHeaderActions={renderCommentTrigger('ibtUsd', 'IBT (USD)')}
        />
      </div>

      {/* 21. Net Income (USD) & 22. Total Assets (USD) */}
      <div
        className="two-col-field-grid"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          columnGap: '24px',
          rowGap: '16px',
        }}
      >
        <SharedTextInput
          label="Net Income (USD)"
          value={issue.netIncomeUsd != null ? String(issue.netIncomeUsd) : ''}
          onChange={(val) => onFieldChange('netIncomeUsd', val)}
          placeholder="$0.00"
          disabled={isFieldDisabled}
          extraHeaderActions={renderCommentTrigger('netIncomeUsd', 'Net Income (USD)')}
        />
        <SharedTextInput
          label="Total Assets (USD)"
          value={issue.totalAssetsUsd != null ? String(issue.totalAssetsUsd) : ''}
          onChange={(val) => onFieldChange('totalAssetsUsd', val)}
          placeholder="$0.00"
          disabled={isFieldDisabled}
          extraHeaderActions={renderCommentTrigger('totalAssetsUsd', 'Total Assets (USD)')}
        />
      </div>

      {/* 23. Exception Remediation Date */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SharedCheckbox
            checked={Boolean(issue.hasExceptionRemedDate || issue.exceptionRemedDate)}
            onChange={(checked) => onFieldChange('hasExceptionRemedDate', checked)}
            label="Enable Exception Remediation Date"
            disabled={isFieldDisabled}
          />
        </div>
        {(issue.hasExceptionRemedDate || issue.exceptionRemedDate) && (
          <div style={{ maxWidth: '280px' }}>
            <SharedTextInput
              label="Exception Remediation Date"
              type="date"
              value={issue.exceptionRemedDate || ''}
              onChange={(val) => onFieldChange('exceptionRemedDate', val)}
              disabled={isFieldDisabled}
              extraHeaderActions={renderCommentTrigger('exceptionRemedDate', 'Exception Remediation Date')}
            />
          </div>
        )}
      </div>

      {/* 24. Accountable Contact */}
      <SharedSelect
        label="Accountable Contact"
        value={issue.primaryBusinessOwnerId || issue.businessContactId || issue.accountableContact || ''}
        onChange={(v) => {
          const selectedOpt = systemUsers.find((u) => u.value === v);
          onFieldChange('primaryBusinessOwnerId', v as string);
          onFieldChange('businessContactId', v as string);
          if (selectedOpt) {
            onFieldChange('primaryBusinessOwnerName', selectedOpt.label);
            onFieldChange('accountableContact', selectedOpt.label);
            onFieldChange('businessContactName', selectedOpt.label);
          }
        }}
        options={systemUsers}
        placeholder="Select Accountable Contact..."
        disabled={isFieldDisabled}
        extraHeaderActions={renderCommentTrigger('primaryBusinessOwnerId', 'Accountable Contact')}
      />

      {/* 25. Supporting Business Contact(s) (Multi Select) */}
      <SharedMultiSelect
        label="Supporting Business Contact(s)"
        value={issue.secondaryBusinessOwnerIds || []}
        onChange={(vals) => onFieldChange('secondaryBusinessOwnerIds', vals)}
        options={systemUsers}
        placeholder="Select Supporting Business Contact(s)..."
        disabled={isFieldDisabled}
        extraHeaderActions={renderCommentTrigger('secondaryBusinessOwnerIds', 'Supporting Business Contact(s)')}
      />

      {/* 26. Agreed Remediation Date */}
      <div style={{ maxWidth: '320px' }}>
        <SharedTextInput
          label="Agreed Remediation Date"
          type="date"
          value={issue.agreedRemediationDate || issue.remediationTargetDate || ''}
          onChange={(val) => {
            onFieldChange('agreedRemediationDate', val);
            onFieldChange('remediationTargetDate', val);
          }}
          disabled={isFieldDisabled}
          extraHeaderActions={renderCommentTrigger('agreedRemediationDate', 'Agreed Remediation Date')}
        />
      </div>
    </div>
  );
};

