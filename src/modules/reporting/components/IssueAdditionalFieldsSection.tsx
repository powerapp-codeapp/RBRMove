import React from 'react';
import {
  SharedTextArea,
  SharedSelect,
  SharedMultiSelect,
  SharedTextInput,
  SharedCheckbox,
} from '../../../components/shared';
import type { CriticalityLevel } from '../../../types/dataverse.types';

export interface IssueAdditionalFieldsState {
  summaryFinding: string;
  setSummaryFinding: (v: string) => void;
  auditorResponse: string;
  setAuditorResponse: (v: string) => void;
  mitigatingControl: string;
  setMitigatingControl: (v: string) => void;
  exceptionRemedComments: string;
  setExceptionRemedComments: (v: string) => void;

  issueType: string;
  setIssueType: (v: string) => void;
  issueTypeOptions: Array<{ value: string; label: string }>;

  issueCauseType: string;
  setRootCauseType: (v: string) => void;
  rootCauseTypeOptions: Array<{ value: string; label: string }>;

  criticality: CriticalityLevel;
  setCriticality: (v: CriticalityLevel) => void;
  criticalityOptions: Array<{ value: string; label: string }>;

  soxReportable: 'No' | 'Yes';
  setSoxReportable: (v: 'No' | 'Yes') => void;
  yesNoOptions: Array<{ value: string; label: string }>;

  issueSource: string;
  setIssueSource: (v: string) => void;
  issueSourceOptions: Array<{ value: string; label: string }>;

  keyTheme: string;
  setKeyTheme: (v: string) => void;
  keyThemeOptions: Array<{ value: string; label: string }>;

  processArea: string;
  setProcessArea: (v: string) => void;
  processAreaOptions: Array<{ value: string; label: string }>;

  repeatFinding: string;
  setRepeatFinding: (v: string) => void;
  repeatFindingOptions: Array<{ value: string; label: string }>;

  itAssetAccountableSector: string;
  setItAssetAccountableSector: (v: string) => void;
  itAssetAccountableSectorOptions: Array<{ value: string; label: string }>;

  accountableFunction: string;
  setAccountableFunction: (v: string) => void;
  accountableFunctionOptions: Array<{ value: string; label: string }>;

  impactedRegion: string;
  setImpactedRegion: (v: string) => void;
  impactedRegionOptions: Array<{ value: string; label: string }>;

  impactedSector: string;
  setImpactedSector: (v: string) => void;
  impactedSectorOptions: Array<{ value: string; label: string }>;

  impactedMrc: string;
  setImpactedMrc: (v: string) => void;
  impactedMrcOptions: Array<{ value: string; label: string }>;

  quarterImpacted: string;
  setQuarterImpacted: (v: string) => void;
  quarterImpactedOptions: Array<{ value: string; label: string }>;

  salesUsd: string;
  setSalesUsd: (v: string) => void;
  ibtUsd: string;
  setIbtUsd: (v: string) => void;
  netIncomeUsd: string;
  setNetIncomeUsd: (v: string) => void;
  totalAssetsUsd: string;
  setTotalAssetsUsd: (v: string) => void;

  hasExceptionRemedDate: boolean;
  setHasExceptionRemedDate: (v: boolean) => void;
  exceptionRemedDate: string;
  setExceptionRemedDate: (v: string) => void;

  primaryBusinessOwner: string;
  setPrimaryBusinessOwner: (v: string) => void;
  secondaryBusinessOwners: string[];
  setSecondaryBusinessOwners: (v: string[]) => void;
  systemUsers: Array<{ value: string; label: string }>;
}

export interface IssueAdditionalFieldsSectionProps {
  state: IssueAdditionalFieldsState;
  isNested?: boolean;
}

export const IssueAdditionalFieldsSection: React.FC<IssueAdditionalFieldsSectionProps> = ({
  state,
  isNested = false,
}) => {
  return (
    <div
      style={{
        backgroundColor: isNested ? 'transparent' : '#FAFAFA',
        border: isNested ? 'none' : '1px solid #EAEAEA',
        borderRadius: isNested ? '0' : '8px',
        padding: isNested ? '0' : '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        animation: 'fadeIn 0.2s ease',
      }}
    >
      {/* 1. Summary Finding Executive Summary */}
      <SharedTextArea
        label="Summary Finding Executive Summary"
        value={state.summaryFinding}
        onChange={state.setSummaryFinding}
        placeholder="Brief executive summary narrative of finding..."
        rows={2}
      />

      {/* 2. Auditor Response */}
      <SharedTextArea
        label="Auditor Response"
        value={state.auditorResponse}
        onChange={state.setAuditorResponse}
        placeholder="Auditor validation or initial assessment notes..."
        rows={2}
      />

      {/* 3. Mitigating Control */}
      <SharedTextArea
        label="Mitigating Control"
        value={state.mitigatingControl}
        onChange={state.setMitigatingControl}
        placeholder="Existing compensating controls in place..."
        rows={2}
      />

      {/* 4. Exception Remediation Comments */}
      <SharedTextArea
        label="Exception Remediation Comments"
        value={state.exceptionRemedComments}
        onChange={state.setExceptionRemedComments}
        placeholder="Remediation timeline comments..."
        rows={2}
      />

      {/* 5. Issue Type & 6. Issue Cause Type */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <SharedSelect
          label="Issue Type"
          value={state.issueType}
          onChange={state.setIssueType}
          options={state.issueTypeOptions}
          placeholder="Select Issue Type..."
        />
        <SharedSelect
          label="Issue Cause Type"
          value={state.issueCauseType}
          onChange={state.setRootCauseType}
          options={state.rootCauseTypeOptions}
          placeholder="Select Issue Cause Type..."
        />
      </div>

      {/* 7. Criticality & 8. SOX Reportable */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <SharedSelect
          label="Criticality"
          value={state.criticality}
          onChange={(v) => state.setCriticality(v as CriticalityLevel)}
          options={state.criticalityOptions}
          placeholder="Select Criticality..."
        />
        <SharedSelect
          label="SOX Reportable"
          value={state.soxReportable}
          onChange={(v) => state.setSoxReportable(v as 'No' | 'Yes')}
          options={state.yesNoOptions}
        />
      </div>

      {/* 9. Issue Finding Source & 10. Key Theme */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <SharedSelect
          label="Issue Finding Source"
          value={state.issueSource}
          onChange={state.setIssueSource}
          options={state.issueSourceOptions}
          placeholder="Select Issue Source..."
        />
        <SharedSelect
          label="Key Theme"
          value={state.keyTheme}
          onChange={state.setKeyTheme}
          options={state.keyThemeOptions}
          placeholder="Select Key Theme..."
        />
      </div>

      {/* 11. Area & 12. Repeat Finding */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <SharedSelect
          label="Area"
          value={state.processArea}
          onChange={state.setProcessArea}
          options={state.processAreaOptions}
          placeholder="Select Area..."
        />
        <SharedSelect
          label="Repeat Finding"
          value={state.repeatFinding}
          onChange={(v) => state.setRepeatFinding(v as string)}
          options={state.repeatFindingOptions.length > 0 ? state.repeatFindingOptions : state.yesNoOptions}
          placeholder="Select Repeat Finding..."
        />
      </div>

      {/* 13. IT Asset Accountable Sector & 14. Accountable Function */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <SharedSelect
          label="IT Asset Accountable Sector"
          value={state.itAssetAccountableSector}
          onChange={state.setItAssetAccountableSector}
          options={state.itAssetAccountableSectorOptions}
          placeholder="Select Accountable Sector..."
        />
        <SharedSelect
          label="Accountable Function"
          value={state.accountableFunction}
          onChange={(v) => state.setAccountableFunction(v as string)}
          options={state.accountableFunctionOptions}
          placeholder="Select Accountable Function..."
        />
      </div>

      {/* 15. Impacted Region & 16. Impacted Sector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <SharedSelect
          label="Impacted Region"
          value={state.impactedRegion}
          onChange={state.setImpactedRegion}
          options={state.impactedRegionOptions}
          placeholder="Select Region..."
        />
        <SharedSelect
          label="Impacted Sector"
          value={state.impactedSector}
          onChange={state.setImpactedSector}
          options={state.impactedSectorOptions}
          placeholder="Select Sector..."
        />
      </div>

      {/* 17. Impact MRC & 18. Quarter Impacted */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <SharedSelect
          label="Impact MRC"
          value={state.impactedMrc}
          onChange={state.setImpactedMrc}
          options={state.impactedMrcOptions}
          placeholder="Select Impact MRC..."
        />
        <SharedSelect
          label="Quarter Impacted"
          value={state.quarterImpacted}
          onChange={state.setQuarterImpacted}
          options={state.quarterImpactedOptions}
          placeholder="Select Quarter..."
        />
      </div>

      {/* 19. Sales (USD) & 20. IBT (USD) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <SharedTextInput
          label="Sales (USD)"
          value={state.salesUsd}
          onChange={(val) => state.setSalesUsd(val)}
          placeholder="$0.00"
        />
        <SharedTextInput
          label="IBT (USD)"
          value={state.ibtUsd}
          onChange={(val) => state.setIbtUsd(val)}
          placeholder="$0.00"
        />
      </div>

      {/* 21. Net Income (USD) & 22. Total Assets (USD) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <SharedTextInput
          label="Net Income (USD)"
          value={state.netIncomeUsd}
          onChange={(val) => state.setNetIncomeUsd(val)}
          placeholder="$0.00"
        />
        <SharedTextInput
          label="Total Assets (USD)"
          value={state.totalAssetsUsd}
          onChange={(val) => state.setTotalAssetsUsd(val)}
          placeholder="$0.00"
        />
      </div>

      {/* 23. Exception Remediation Date */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SharedCheckbox
            checked={state.hasExceptionRemedDate}
            onChange={(checked) => state.setHasExceptionRemedDate(checked)}
            label="Enable Exception Remediation Date"
          />
        </div>
        {state.hasExceptionRemedDate && (
          <div style={{ maxWidth: '280px' }}>
            <SharedTextInput
              label="Exception Remediation Date"
              type="date"
              value={state.exceptionRemedDate}
              onChange={(val) => state.setExceptionRemedDate(val)}
            />
          </div>
        )}
      </div>

      {/* 24. Accountable Contact */}
      <SharedSelect
        label="Accountable Contact"
        value={state.primaryBusinessOwner}
        onChange={(v) => state.setPrimaryBusinessOwner(v as string)}
        options={state.systemUsers}
        placeholder="Select Accountable Contact..."
      />

      {/* 25. Supporting Business Contact(s) (Multi Select) */}
      <SharedMultiSelect
        label="Supporting Business Contact(s)"
        value={state.secondaryBusinessOwners}
        onChange={(vals) => state.setSecondaryBusinessOwners(vals)}
        options={state.systemUsers}
        placeholder="Select Supporting Business Contact(s)..."
      />
    </div>
  );
};

export default IssueAdditionalFieldsSection;

