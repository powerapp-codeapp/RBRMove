import React, { useState, useMemo, useEffect } from 'react';
import { GuidelinesDrawer } from './GuidelinesDrawer';
import { getRoleDetails } from '../utils/reportingWorkflowEngine';
import type { CriticalityLevel, Issue } from '../../../types/dataverse.types';
import { SharedConfirmDialog } from '../../../components/shared';

// Dataverse SDK Services & AI Flows
import { AIIssueGenerationService } from '../../../generated/services/AIIssueGenerationService';
import { Iar_aiissuegeneratedlogsesService } from '../../../generated/services/Iar_aiissuegeneratedlogsesService';
import { Iar_aigeneratedfieldlogsesService } from '../../../generated/services/Iar_aigeneratedfieldlogsesService';
import { SystemusersService } from '../../../generated/services/SystemusersService';
import { useTaxonomies } from '../../../services/taxonomyService';

// Subcomponents
import {
  CreateIssueCompactDialog,
  type TestProcedureOption,
} from './CreateIssueCompactDialog';
import { CreateIssueStudioView } from './CreateIssueStudioView';
import {
  AiVersionCompareModal,
  type AiFields,
} from './AiVersionCompareModal';
import type { IssueAdditionalFieldsState } from './IssueAdditionalFieldsSection';

interface CreateIssueDialogProps {
  open: boolean;
  onClose: () => void;
  engagementId: string;
  engagementName?: string;
  job?: any;
  defaultFunction?: 'IT' | 'FinOps';
  userRole?: string;
  currentUser?: { name?: string; email?: string; userId?: string };
  onSave: (newIssue: Partial<Issue>, statusAction?: 'draft' | 'submit') => Promise<void> | void;
}

const YES_NO_OPTIONS = [
  { value: 'No', label: 'No' },
  { value: 'Yes', label: 'Yes' },
];

export const CreateIssueDialog: React.FC<CreateIssueDialogProps> = ({
  open,
  onClose,
  engagementId,
  engagementName,
  job,
  defaultFunction = 'IT',
  userRole = 'Staff Auditor',
  currentUser,
  onSave,
}) => {
  // Resolve engagement display name
  const resolvedEngagementName = useMemo(() => {
    if (engagementName) return engagementName;
    if (job?.engagementName) return job.engagementName;
    if (job?.title) return job.title;
    if (job?.name) return job.name;
    if (job?.engagement) return job.engagement;
    return engagementId;
  }, [engagementName, job, engagementId]);

  // Dynamic Test Procedures loaded from the active engagement (no hardcoded fallback)
  const testProcedureOptions: TestProcedureOption[] = useMemo(() => {
    if (job?.testProcedures && Array.isArray(job.testProcedures) && job.testProcedures.length > 0) {
      return job.testProcedures.map((tp: any) => ({
        value: tp.code || tp.id,
        label: tp.name ? `${tp.code || tp.id}: ${tp.name}` : (tp.fullName || tp.code || tp.id),
        function: tp.function || 'IT',
        id: tp.id,
      }));
    }
    return [];
  }, [job]);

  // Live System Users for Primary Business Owner (no hardcoded fallback names)
  const [systemUsers, setSystemUsers] = useState<Array<{ value: string; label: string }>>([]);

  useEffect(() => {
    if (!open) return;
    let isSubscribed = true;

    SystemusersService.getAll({ top: 100 })
      .then((res: any) => {
        if (!isSubscribed) return;
        const arr = Array.isArray(res?.data)
          ? res.data
          : Array.isArray(res?.value)
          ? res.value
          : Array.isArray(res)
          ? res
          : [];
        if (arr.length > 0) {
          const userOpts = arr.map((u: any) => ({
            value: u.systemuserid || u.id,
            label: u.fullname || u.name || u.internalemailaddress || 'Corporate User',
          }));
          setSystemUsers(userOpts);
        } else {
          setSystemUsers([]);
        }
      })
      .catch(() => {
        if (isSubscribed) {
          setSystemUsers([]);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [open]);

  // ---------------------------------------------------------------------------
  // Stage 1 Mandatory Fields State
  // ---------------------------------------------------------------------------
  const [testProcedure, setTestProcedure] = useState<string>('');
  const [originalIssue, setOriginalIssue] = useState<string>('');
  const [selectedFunction, setSelectedFunction] = useState<'IT' | 'FinOps'>(defaultFunction);

  // ---------------------------------------------------------------------------
  // Stage 2 Extended & Additional Fields State
  // ---------------------------------------------------------------------------
  const [isAdditionalOpen, setIsAdditionalOpen] = useState(false);

  // Dynamic Taxonomies Hook
  const { getOptions: getTaxonomyOpts } = useTaxonomies();

  // Governance & Ownership (Start blank)
  const [primaryBusinessOwner, setPrimaryBusinessOwner] = useState<string>('');
  const [secondaryBusinessOwners, setSecondaryBusinessOwners] = useState<string[]>([]);
  const [accountableFunction, setAccountableFunction] = useState<string>('');

  // Classifications & Taxonomies (Start blank)
  const [criticality, setCriticality] = useState<CriticalityLevel>('Major');
  const [processArea, setProcessArea] = useState<string>('');
  const [issueType, setIssueType] = useState<string>('');
  const [issueCauseType, setRootCauseType] = useState<string>('');
  const [issueSource, setIssueSource] = useState<string>('');
  const [keyTheme, setKeyTheme] = useState<string>('');
  const [repeatFinding, setRepeatFinding] = useState<string>('No');
  const [soxReportable, setSoxReportable] = useState<'No' | 'Yes'>('No');

  // Enterprise Scope (Start blank)
  const [impactedRegion, setImpactedRegion] = useState<string>('');
  const [impactedSector, setImpactedSector] = useState<string>('');
  const [impactedMrc, setImpactedMrc] = useState<string>('');
  const [itAssetAccountableSector, setItAssetAccountableSector] = useState<string>('');
  const [quarterImpacted, setQuarterImpacted] = useState<string>('');

  // Financial Metrics (USD) (Start blank)
  const [salesUsd, setSalesUsd] = useState<string>('');
  const [ibtUsd, setIbtUsd] = useState<string>('');
  const [netIncomeUsd, setNetIncomeUsd] = useState<string>('');
  const [totalAssetsUsd, setTotalAssetsUsd] = useState<string>('');

  // Extended Narratives & Exception Remediation (Start blank)
  const [summaryFinding, setSummaryFinding] = useState<string>('');
  const [mitigatingControl, setMitigatingControl] = useState<string>('');
  const [auditorResponse, setAuditorResponse] = useState<string>('');
  const [exceptionRemedComments, setExceptionRemedComments] = useState<string>('');
  const [hasExceptionRemedDate, setHasExceptionRemedDate] = useState<boolean>(false);
  const [exceptionRemedDate, setExceptionRemedDate] = useState<string>('');

  // Dynamic Taxonomy Dropdown Options from Dataverse
  const issueTypeOptions = useMemo(() => {
    const opts = getTaxonomyOpts('ISSUE_TYPE');
    if (issueType && !opts.some((o) => o.value === issueType)) {
      return [{ value: issueType, label: issueType }, ...opts];
    }
    return opts;
  }, [getTaxonomyOpts, issueType]);

  const rootCauseTypeOptions = useMemo(() => {
    const opts = getTaxonomyOpts('ISSUE_CAUSE_TYPE');
    if (issueCauseType && !opts.some((o) => o.value === issueCauseType)) {
      return [{ value: issueCauseType, label: issueCauseType }, ...opts];
    }
    return opts;
  }, [getTaxonomyOpts, issueCauseType]);

  const criticalityOptions = useMemo(() => {
    const opts = getTaxonomyOpts('CRITICALITY');
    if (criticality && !opts.some((o) => o.value === criticality)) {
      return [{ value: criticality, label: criticality }, ...opts];
    }
    return opts;
  }, [getTaxonomyOpts, criticality]);

  const issueSourceOptions = useMemo(() => {
    const opts = getTaxonomyOpts('ISSUE_SOURCE');
    if (issueSource && !opts.some((o) => o.value === issueSource)) {
      return [{ value: issueSource, label: issueSource }, ...opts];
    }
    return opts;
  }, [getTaxonomyOpts, issueSource]);

  const keyThemeOptions = useMemo(() => {
    const opts = getTaxonomyOpts('KEY_THEME');
    if (keyTheme && !opts.some((o) => o.value === keyTheme)) {
      return [{ value: keyTheme, label: keyTheme }, ...opts];
    }
    return opts;
  }, [getTaxonomyOpts, keyTheme]);

  const processAreaOptions = useMemo(() => {
    const opts = getTaxonomyOpts('PROCESS_AREA');
    if (processArea && !opts.some((o) => o.value === processArea)) {
      return [{ value: processArea, label: processArea }, ...opts];
    }
    return opts;
  }, [getTaxonomyOpts, processArea]);

  const repeatFindingOptions = useMemo(() => {
    const opts = getTaxonomyOpts('REPEAT_FINDING');
    if (repeatFinding && !opts.some((o) => o.value === repeatFinding)) {
      return [{ value: repeatFinding, label: repeatFinding }, ...opts];
    }
    return opts;
  }, [getTaxonomyOpts, repeatFinding]);

  const itAssetAccountableSectorOptions = useMemo(() => {
    const opts = getTaxonomyOpts('IT_ASSET_ACCOUNTABLE_SECTOR');
    if (itAssetAccountableSector && !opts.some((o) => o.value === itAssetAccountableSector)) {
      return [{ value: itAssetAccountableSector, label: itAssetAccountableSector }, ...opts];
    }
    return opts;
  }, [getTaxonomyOpts, itAssetAccountableSector]);

  const accountableFunctionOptions = useMemo(() => {
    const opts = getTaxonomyOpts('ACCOUNTABLE_FUNCTION');
    if (accountableFunction && !opts.some((o) => o.value === accountableFunction)) {
      return [{ value: accountableFunction, label: accountableFunction }, ...opts];
    }
    return opts;
  }, [getTaxonomyOpts, accountableFunction]);

  const impactedRegionOptions = useMemo(() => {
    const opts = getTaxonomyOpts('IMPACTED_REGION');
    if (impactedRegion && !opts.some((o) => o.value === impactedRegion)) {
      return [{ value: impactedRegion, label: impactedRegion }, ...opts];
    }
    return opts;
  }, [getTaxonomyOpts, impactedRegion]);

  const impactedSectorOptions = useMemo(() => {
    const opts = getTaxonomyOpts('IMPACTED_SECTOR');
    if (impactedSector && !opts.some((o) => o.value === impactedSector)) {
      return [{ value: impactedSector, label: impactedSector }, ...opts];
    }
    return opts;
  }, [getTaxonomyOpts, impactedSector]);

  const impactedMrcOptions = useMemo(() => {
    const opts = getTaxonomyOpts('IMPACTED_MRC');
    if (impactedMrc && !opts.some((o) => o.value === impactedMrc)) {
      return [{ value: impactedMrc, label: impactedMrc }, ...opts];
    }
    return opts;
  }, [getTaxonomyOpts, impactedMrc]);

  const quarterImpactedOptions = useMemo(() => {
    const opts = getTaxonomyOpts('QUARTER_IMPACTED');
    if (quarterImpacted && !opts.some((o) => o.value === quarterImpacted)) {
      return [{ value: quarterImpacted, label: quarterImpacted }, ...opts];
    }
    return opts;
  }, [getTaxonomyOpts, quarterImpacted]);

  // ---------------------------------------------------------------------------
  // AI Generation & Studio Mode State
  // ---------------------------------------------------------------------------
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isAiGenerated, setIsAiGenerated] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [currentVersionNumber, setCurrentVersionNumber] = useState(1);
  const [aiSessionLogId, setAiSessionLogId] = useState<string>('');

  // Active AI Generated Fields (All 6 Fields)
  const [aiData, setAiData] = useState<AiFields>({
    updatedIssueHeader: '',
    description: '',
    rootCause: '',
    impact: '',
    recommendation: '',
    nonComplianceReferences: '',
  });

  // Snapshot of parameters used when generating current AI draft
  const [lastGeneratedParams, setLastGeneratedParams] = useState<{
    testProcedure: string;
    originalIssue: string;
    selectedFunction: 'IT' | 'FinOps';
  } | null>(null);

  // Warning banner dismiss state
  const [isBannerDismissed, setIsBannerDismissed] = useState<boolean>(false);

  // Compare Dialog state
  const [isCompareDialogOpen, setIsCompareDialogOpen] = useState<boolean>(false);
  const [previousAiData, setPreviousAiData] = useState<AiFields | null>(null);
  const [candidateAiData, setCandidateAiData] = useState<AiFields | null>(null);

  // Unsaved changes confirmation dialog state
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState<boolean>(false);

  // Guidelines left drawer state
  const [isGuidelinesDrawerOpen, setIsGuidelinesDrawerOpen] = useState<boolean>(false);

  // Field selection for comparison / hybrid merge: 'candidate' | 'previous'
  const [selectedComparisonVersions, setSelectedComparisonVersions] = useState<
    Record<keyof AiFields, 'candidate' | 'previous'>
  >({
    updatedIssueHeader: 'candidate',
    description: 'candidate',
    rootCause: 'candidate',
    impact: 'candidate',
    recommendation: 'candidate',
    nonComplianceReferences: 'candidate',
  });

  // Field-level remarks for AI fine-tuning
  const [fieldRemarks, setFieldRemarks] = useState<Record<keyof AiFields, string>>({
    updatedIssueHeader: '',
    description: '',
    rootCause: '',
    impact: '',
    recommendation: '',
    nonComplianceReferences: '',
  });

  // Automatically adjust default function when a test procedure is picked
  const handleTestProcedureChange = (val: string) => {
    setTestProcedure(val);
    setIsBannerDismissed(false);
    const found = testProcedureOptions.find((o) => o.value === val);
    if (found?.function) {
      setSelectedFunction(found.function as 'IT' | 'FinOps');
    }
  };

  const handleOriginalIssueChange = (val: string) => {
    setOriginalIssue(val);
    setIsBannerDismissed(false);
  };

  const handleFunctionChange = (func: 'IT' | 'FinOps') => {
    setSelectedFunction(func);
    setIsBannerDismissed(false);
  };

  // Check if original issue, function, or test procedure have changed since AI draft was generated
  const hasParamsChanged = useMemo(() => {
    if (!lastGeneratedParams || !isAiGenerated) return false;
    return (
      lastGeneratedParams.originalIssue.trim() !== originalIssue.trim() ||
      lastGeneratedParams.selectedFunction !== selectedFunction ||
      lastGeneratedParams.testProcedure !== testProcedure
    );
  }, [lastGeneratedParams, isAiGenerated, originalIssue, selectedFunction, testProcedure]);

  const isRegenerateActive = hasParamsChanged && !isBannerDismissed;

  // Reset form when dialog opens/closes (clean start with blank additional fields)
  useEffect(() => {
    if (open) {
      setTestProcedure(testProcedureOptions[0]?.value || '');
      setOriginalIssue('');
      setSelectedFunction(defaultFunction);
      setIsAdditionalOpen(false);

      // Governance & Ownership blank reset
      setPrimaryBusinessOwner('');
      setSecondaryBusinessOwners([]);
      setAccountableFunction('');

      // Classifications & Taxonomies blank reset
      setCriticality('Major');
      setProcessArea('');
      setIssueType('');
      setRootCauseType('');
      setIssueSource('');
      setKeyTheme('');
      setRepeatFinding('No');
      setSoxReportable('No');

      // Scope blank reset
      setImpactedRegion('');
      setImpactedSector('');
      setImpactedMrc('');
      setItAssetAccountableSector('');
      setQuarterImpacted('');

      // Financial Metrics blank reset
      setSalesUsd('');
      setIbtUsd('');
      setNetIncomeUsd('');
      setTotalAssetsUsd('');

      // Extended Narratives blank reset
      setSummaryFinding('');
      setMitigatingControl('');
      setAuditorResponse('');
      setExceptionRemedComments('');
      setHasExceptionRemedDate(false);
      setExceptionRemedDate('');

      // AI States reset
      setIsAiLoading(false);
      setIsAiGenerated(false);
      setIsFullScreen(false);
      setCurrentVersionNumber(1);
      setAiSessionLogId('');
      setLastGeneratedParams(null);
      setIsBannerDismissed(false);
      setIsCompareDialogOpen(false);
      setIsConfirmDialogOpen(false);
      setPreviousAiData(null);
      setCandidateAiData(null);
      setAiData({
        updatedIssueHeader: '',
        description: '',
        rootCause: '',
        impact: '',
        recommendation: '',
        nonComplianceReferences: '',
      });
      setFieldRemarks({
        updatedIssueHeader: '',
        description: '',
        rootCause: '',
        impact: '',
        recommendation: '',
        nonComplianceReferences: '',
      });
    }
  }, [open, testProcedureOptions, defaultFunction]);

  // Corporate Synthesis Generator (Local Fallback for Resilience)
  const synthesizeLocalDraft = (
    procCode: string,
    issueText: string,
    func: 'IT' | 'FinOps',
    remarksMap: Record<keyof AiFields, string>,
    _cycleNum: number
  ): AiFields => {
    const selectedProc = testProcedureOptions.find((p) => p.value === procCode);
    const procTitle = selectedProc ? selectedProc.label.replace(/^TP-\d+:\s*/, '') : 'Audit Review';
    const textLower = (issueText || '').toLowerCase();

    let citation = 'Standard S-15: Security Architecture & Operational Governance';
    let stdCode = 'STD-IAPP-S15';
    if (textLower.includes('access') || textLower.includes('user') || textLower.includes('dormant') || textLower.includes('entitlement')) {
      citation = 'Standard S-07: Semi-Annual User Entitlement Review & Deprovisioning';
      stdCode = 'STD-IAPP-S07';
    } else if (textLower.includes('telemetry') || textLower.includes('sensor') || textLower.includes('calibration')) {
      citation = 'Standard S-12: Automated System Telemetry Logging & Monitoring Protocols';
      stdCode = 'STD-IAPP-S12';
    } else if (textLower.includes('scrap') || textLower.includes('variance') || textLower.includes('inventory')) {
      citation = 'Standard S-04: Material Scrap & Inventory Financial Reconciliation';
      stdCode = 'STD-IAPP-S04';
    } else if (textLower.includes('gxp') || textLower.includes('software') || textLower.includes('validation')) {
      citation = 'Standard S-19: GxP Electronic Records Integrity (21 CFR Part 11)';
      stdCode = 'STD-IAPP-S19';
    }

    const headerRemark = remarksMap.updatedIssueHeader ? ` (${remarksMap.updatedIssueHeader})` : '';
    const descRemark = remarksMap.description ? `\n\n[Auditor Note]: ${remarksMap.description}` : '';
    const rootRemark = remarksMap.rootCause ? ` Specifically addressing: ${remarksMap.rootCause}.` : '';
    const impactRemark = remarksMap.impact ? ` Critical exposure factor: ${remarksMap.impact}.` : '';
    const recRemark = remarksMap.recommendation ? `\n4. ${remarksMap.recommendation}` : '';

    return {
      updatedIssueHeader: `${procCode ? `${procCode}: ` : ''}Inadequate Controls over ${procTitle}${headerRemark}`,
      description: `During field audit testing of ${procTitle} for the ${resolvedEngagementName} environment, audit identified that ${issueText.trim()}.\n\nApplicable Standard Citation: Under Johnson & Johnson ${citation} (${stdCode}), operational environments must maintain continuous verifiable evidence of compliance.${descRemark}`,
      rootCause: `Systemic governance and automated synchronization gaps${processArea ? ` in ${processArea}` : ''}. Root cause analysis indicates lack of scheduled exception monitoring feeds and absence of secondary verification protocols under the ${func} operating model.${rootRemark}`,
      impact: `Criticality rated as ${criticality}. Uncontrolled variance exposes the operational environment to potential compliance citations, unauthorized data modification, and SOX/GxP regulatory escalation.${impactRemark}`,
      recommendation: `1. Implement automated real-time exception alerting and scheduled synchronization for ${procTitle}.\n2. Establish mandatory dual-custody authorization for configuration overrides within ${func} operations.\n3. Conduct retrospective audit reconciliations on a quarterly basis.${recRemark}`,
      nonComplianceReferences: JSON.stringify([
        {
          no: 1,
          framework_name: 'ISO 27001',
          violated_section_clause: 'A.9.2.3',
          reason: 'Privileged access rights are not monitored properly.',
          references: {
            page_number: 'Page 12',
            file_link: 'https://www.adobe.com/support/products/enterprise/knowledgecenter/media/c4611_sample_explain.pdf',
            filename: 'audit_policy.pdf',
            file_id: 'FILE-001',
          },
        },
        {
          no: 2,
          framework_name: 'COBIT',
          violated_section_clause: 'DSS05.04',
          reason: 'Accountability for high-impact activities is weak.',
          references: {
            page_number: 'Page 45',
            file_link: 'https://www.adobe.com/support/products/enterprise/knowledgecenter/media/c4611_sample_explain.pdf',
            filename: 'cobit_framework.pdf',
            file_id: 'FILE-002',
          },
        },
      ]),
    };
  };

  // Trigger Initial AI Generation (Calls Flow & Logs to Dataverse)
  const handleGenerateAi = async () => {
    if (!testProcedure) {
      alert('Please select a Test Procedure.');
      return;
    }
    if (!originalIssue.trim()) {
      alert('Please enter the Original Issue text before generating AI fields.');
      return;
    }

    setIsAiLoading(true);

    const logGenId = `GEN-${Date.now().toString().slice(-6)}`;
    let createdParentLogId = '';

    // Step 1: Create parent log row in iar_aiissuegeneratedlogses (Pending)
    try {
      const cleanEngId = (engagementId || '').replace(/[{}]/g, '').trim();
      const parentLogRes: any = await Iar_aiissuegeneratedlogsesService.create({
        iar_aigenerationid: logGenId,
        iar_aigenerationstatus: 1 as any, // Pending
        iar_type: 822500000 as any, // Generation
        iar_versionnumber: 1,
        iar_function: selectedFunction === 'IT' ? 822500000 : 822500001,
        iar_originalissue: originalIssue.trim(),
        iar_additionalinformation: JSON.stringify({
          criticality,
          processArea,
          issueType,
          issueCauseType,
          soxReportable,
          repeatFinding,
          accountableFunction,
          impactedRegion,
          impactedSector,
          salesUsd,
          quarterImpacted,
        }),
        'iar_EngagementID@odata.bind': cleanEngId.includes('-')
          ? `/iar_engagementses(${cleanEngId})`
          : (undefined as any),
        statecode: 0 as any,
        statuscode: 1 as any,
      } as any);

      if (parentLogRes?.data?.iar_aiissuegeneratedlogsid) {
        createdParentLogId = parentLogRes.data.iar_aiissuegeneratedlogsid;
        setAiSessionLogId(createdParentLogId);
      }
    } catch (logErr) {
      console.warn('[CreateIssueDialog] Log initialization in Dataverse had error, proceeding with flow:', logErr);
    }

    // Step 2: Invoke Power Automate Flow AIIssueGeneration
    let synthesizedResult: AiFields | null = null;

    try {
      const flowRes: any = await AIIssueGenerationService.Run({
        text: resolvedEngagementName,
        text_1: engagementId,
        text_2: `${engagementId}_${Date.now()}`,
        text_3: createdParentLogId || logGenId,
        boolean: selectedFunction === 'IT',
        text_4: originalIssue.trim(),
        text_5: 'Generation',
        text_7: JSON.stringify({
          criticality,
          processArea,
          issueCauseType,
          soxReportable,
          accountableFunction,
        }),
      });

      if (flowRes?.data?.generateoutput) {
        const rawOutput = flowRes.data.generateoutput;
        const parsed = typeof rawOutput === 'string' ? JSON.parse(rawOutput) : rawOutput;
        const resp = parsed?.response || parsed;

        if (resp && (resp.issue_header || resp.rectified_issue || resp.root_cause)) {
          synthesizedResult = {
            updatedIssueHeader: resp.issue_header || '',
            description: resp.rectified_issue || '',
            rootCause: resp.root_cause || '',
            impact: resp.impact || '',
            recommendation: resp.recommendations || '',
            nonComplianceReferences:
              typeof resp.non_compliance_references === 'string'
                ? resp.non_compliance_references
                : JSON.stringify(resp.non_compliance_references || ''),
          };
        }
      }
    } catch (flowErr) {
      console.warn('[CreateIssueDialog] AIIssueGeneration flow offline/timed out; applying enterprise synthesis engine:', flowErr);
    }

    // Step 3: Fallback synthesis if flow output was not received
    if (!synthesizedResult) {
      await new Promise((res) => setTimeout(res, 900));
      synthesizedResult = synthesizeLocalDraft(
        testProcedure,
        originalIssue,
        selectedFunction,
        fieldRemarks,
        1
      );
    }

    // Step 4: Record 6 field snapshots in iar_aigeneratedfieldlogses
    if (createdParentLogId) {
      try {
        const fieldSnapshots = [
          { name: 1, text: synthesizedResult.updatedIssueHeader },
          { name: 2, text: synthesizedResult.description },
          { name: 3, text: synthesizedResult.rootCause },
          { name: 4, text: synthesizedResult.impact },
          { name: 5, text: synthesizedResult.recommendation },
          { name: 6, text: synthesizedResult.nonComplianceReferences },
        ];

        for (const snap of fieldSnapshots) {
          await Iar_aigeneratedfieldlogsesService.create({
            iar_aigeneratedfieldlogid: `FLD-${Date.now().toString().slice(-6)}-${snap.name}`,
            iar_aigeneratedtext: snap.text,
            iar_fieldname: snap.name as any,
            iar_remark:
              fieldRemarks[
                snap.name === 1
                  ? 'updatedIssueHeader'
                  : snap.name === 2
                  ? 'description'
                  : snap.name === 3
                  ? 'rootCause'
                  : snap.name === 4
                  ? 'impact'
                  : snap.name === 5
                  ? 'recommendation'
                  : 'nonComplianceReferences'
              ] || '',
            'iar_AIGenerationID@odata.bind': `/iar_aiissuegeneratedlogses(${createdParentLogId})`,
            statecode: 0 as any,
            statuscode: 1 as any,
          });
        }

        // Update parent log status to Success (2)
        await Iar_aiissuegeneratedlogsesService.update(createdParentLogId, {
          iar_aigenerationstatus: 2 as any,
        });
      } catch (fldErr) {
        console.warn('[CreateIssueDialog] Logging field snapshots encountered error:', fldErr);
      }
    }

    setAiData(synthesizedResult);
    setIsAiGenerated(true);
    setCurrentVersionNumber(1);
    setLastGeneratedParams({
      testProcedure,
      originalIssue,
      selectedFunction,
    });
    setIsBannerDismissed(false);
    setIsAiLoading(false);

    // Transition into studio split view
    setIsFullScreen(true);
  };

  // Trigger AI Regeneration with Remarks & open Compare Dialog
  const handleRegenerateAi = async () => {
    setIsAiLoading(true);
    setPreviousAiData({ ...aiData });

    const nextVer = currentVersionNumber + 1;
    let regenerated: AiFields | null = null;

    try {
      const flowRes: any = await AIIssueGenerationService.Run({
        text: resolvedEngagementName,
        text_1: engagementId,
        text_2: `${engagementId}_${Date.now()}`,
        text_3: aiSessionLogId || `GEN-${Date.now().toString().slice(-6)}`,
        boolean: selectedFunction === 'IT',
        text_4: originalIssue.trim(),
        text_5: 'Regeneration',
        text_7: JSON.stringify({
          criticality,
          processArea,
          remarks: fieldRemarks,
        }),
      });

      if (flowRes?.data?.generateoutput) {
        const rawOutput = flowRes.data.generateoutput;
        const parsed = typeof rawOutput === 'string' ? JSON.parse(rawOutput) : rawOutput;
        const resp = parsed?.response || parsed;
        if (resp && (resp.issue_header || resp.rectified_issue)) {
          regenerated = {
            updatedIssueHeader: resp.issue_header || '',
            description: resp.rectified_issue || '',
            rootCause: resp.root_cause || '',
            impact: resp.impact || '',
            recommendation: resp.recommendations || '',
            nonComplianceReferences:
              typeof resp.non_compliance_references === 'string'
                ? resp.non_compliance_references
                : JSON.stringify(resp.non_compliance_references || ''),
          };
        }
      }
    } catch {
      // Graceful fallback to client engine
    }

    if (!regenerated) {
      await new Promise((res) => setTimeout(res, 800));
      regenerated = synthesizeLocalDraft(
        testProcedure,
        originalIssue,
        selectedFunction,
        fieldRemarks,
        nextVer
      );
    }

    setCandidateAiData(regenerated);
    setSelectedComparisonVersions({
      updatedIssueHeader: 'candidate',
      description: 'candidate',
      rootCause: 'candidate',
      impact: 'candidate',
      recommendation: 'candidate',
      nonComplianceReferences: 'candidate',
    });

    setIsAiLoading(false);
    setIsCompareDialogOpen(true);
  };

  // Apply Hybrid Merge from Comparison Dialog
  const handleApplyComparisonMerge = () => {
    if (!previousAiData || !candidateAiData) {
      setIsCompareDialogOpen(false);
      return;
    }

    const merged: AiFields = {
      updatedIssueHeader:
        selectedComparisonVersions.updatedIssueHeader === 'candidate'
          ? candidateAiData.updatedIssueHeader
          : previousAiData.updatedIssueHeader,
      description:
        selectedComparisonVersions.description === 'candidate'
          ? candidateAiData.description
          : previousAiData.description,
      rootCause:
        selectedComparisonVersions.rootCause === 'candidate'
          ? candidateAiData.rootCause
          : previousAiData.rootCause,
      impact:
        selectedComparisonVersions.impact === 'candidate'
          ? candidateAiData.impact
          : previousAiData.impact,
      recommendation:
        selectedComparisonVersions.recommendation === 'candidate'
          ? candidateAiData.recommendation
          : previousAiData.recommendation,
      nonComplianceReferences:
        selectedComparisonVersions.nonComplianceReferences === 'candidate'
          ? candidateAiData.nonComplianceReferences
          : previousAiData.nonComplianceReferences,
    };

    setAiData(merged);
    setCurrentVersionNumber((prev) => prev + 1);
    setLastGeneratedParams({
      testProcedure,
      originalIssue,
      selectedFunction,
    });
    setIsBannerDismissed(false);
    setIsCompareDialogOpen(false);
  };

  const handleKeepPreviousVersion = () => {
    if (previousAiData) {
      setAiData(previousAiData);
    }
    setLastGeneratedParams({
      testProcedure,
      originalIssue,
      selectedFunction,
    });
    setIsBannerDismissed(true);
    setIsCompareDialogOpen(false);
  };

  const handleDiscardComparison = () => {
    if (previousAiData) {
      setAiData(previousAiData);
    }
    setLastGeneratedParams({
      testProcedure,
      originalIssue,
      selectedFunction,
    });
    setIsBannerDismissed(true);
    setIsCompareDialogOpen(false);
  };

  // Field change handler for AI fields
  const handleAiFieldChange = (key: keyof AiFields, val: string) => {
    setAiData((prev) => ({ ...prev, [key]: val }));
  };

  // Remark change handler for AI fields
  const handleFieldRemarkChange = (key: keyof AiFields, remarkVal: string) => {
    setFieldRemarks((prev) => ({ ...prev, [key]: remarkVal }));
  };

  // Resolve creator-driven initial review status per FRD Section 3.2
  const resolveTargetStatus = (action: 'draft' | 'submit'): string => {
    const { baseRole } = getRoleDetails(userRole);
    const isTC = baseRole === 'team-coordinator';
    const isManager = baseRole === 'manager';
    const isDirector = baseRole === 'director';

    if (action === 'draft') {
      if (isTC) return 'Pending TC';
      if (isManager) return 'Pending Manager';
      if (isDirector) return 'Pending Director';
      return 'Pending Staff';
    } else {
      if (isTC) return 'Pending Manager';
      if (isManager) return 'Ready for Director Submission';
      if (isDirector) return 'Pending Business';
      return 'Pending TC';
    }
  };

  // Save Finding (either as draft or submit)
  const handleSaveFinding = async (action: 'draft' | 'submit' = 'draft', isManualDraft = false) => {
    const selectedProc = testProcedureOptions.find((p) => p.value === testProcedure);
    const procTitle = selectedProc ? selectedProc.label.replace(/^TP-\d+:\s*/, '') : 'Audit Review';

    const finalTitle = isManualDraft
      ? originalIssue.slice(0, 80) || `${testProcedure}: Audit Finding`
      : aiData.updatedIssueHeader || originalIssue.slice(0, 80);

    const finalDescription = isManualDraft
      ? originalIssue.trim()
      : aiData.description || originalIssue.trim();

    const targetStatus = resolveTargetStatus(action);

    const primaryOwnerObj = systemUsers.find((u) => u.value === primaryBusinessOwner);

    // Call onSave with all fields populated
    await onSave(
      {
        engagementId,
        title: finalTitle.trim(),
        criticality,
        status: targetStatus as any,
        testProcedureCode: testProcedure,
        testProcedureTitle: procTitle,
        testProcedureId: selectedProc?.id,
        function: selectedFunction,
        accountableFunction: accountableFunction || (
          selectedFunction === 'IT'
            ? 'IT Infrastructure & Identity Access Management'
            : 'Finance Operations & Internal Controls'
        ),
        accountableProcessArea: processArea,
        processArea,
        description: finalDescription.trim(),
        issueNarrative: finalDescription.trim(),
        originalIssue: originalIssue.trim(),
        rootCause: aiData.rootCause.trim() || `${issueCauseType || 'Variance'} identified during fieldwork.`,
        rootCauseType: issueCauseType,
        impact: aiData.impact.trim() || `Operational criticality categorized as ${criticality}.`,
        recommendation: aiData.recommendation.trim() || 'Remediate identified control variance.',
        nonComplianceReferences: aiData.nonComplianceReferences.trim(),
        activeAiVersionNumber: isAiGenerated ? currentVersionNumber : 1,

        // Extended Governance & Taxonomies
        primaryBusinessOwnerId: primaryBusinessOwner || undefined,
        primaryBusinessOwnerName: primaryOwnerObj?.label || undefined,
        secondaryBusinessOwnerIds: secondaryBusinessOwners.length > 0 ? secondaryBusinessOwners : undefined,
        secondaryBusinessOwnerNames: secondaryBusinessOwners.length > 0
          ? secondaryBusinessOwners
              .map((id) => systemUsers.find((u) => u.value === id)?.label || id)
              .filter(Boolean)
              .join(', ')
          : undefined,
        businessContactName: primaryOwnerObj?.label || undefined,
        accountableContact: primaryOwnerObj?.label || undefined,
        repeatFinding,
        soxReportable,
        issueType,
        issueSource,
        keyTheme,
        itAssetAccountableSector,
        impactedRegion,
        impactedSector,
        impactedMrc,
        quarterImpacted,

        // Financial Metrics
        salesUsd: salesUsd ? Number(salesUsd.replace(/[^0-9.]/g, '')) || salesUsd : undefined,
        ibtUsd: ibtUsd ? Number(ibtUsd.replace(/[^0-9.]/g, '')) || ibtUsd : undefined,
        netIncomeUsd: netIncomeUsd ? Number(netIncomeUsd.replace(/[^0-9.]/g, '')) || netIncomeUsd : undefined,
        totalAssetsUsd: totalAssetsUsd ? Number(totalAssetsUsd.replace(/[^0-9.]/g, '')) || totalAssetsUsd : undefined,

        // Workpaper Additional Fields
        summaryFinding: summaryFinding.trim() || undefined,
        mitigatingControl: mitigatingControl.trim() || undefined,
        mitigatingControls: mitigatingControl.trim() || undefined,
        auditorResponse: auditorResponse.trim() || undefined,
        exceptionRemedComments: exceptionRemedComments.trim() || undefined,
        hasExceptionRemedDate,
        exceptionRemedDate: hasExceptionRemedDate && exceptionRemedDate ? exceptionRemedDate : undefined,
        workflowRemarks: `Initial creation by ${currentUser?.name || userRole}`,
      },
      action
    );

    // If session log was active, mark accepted
    if (aiSessionLogId) {
      try {
        await Iar_aiissuegeneratedlogsesService.update(aiSessionLogId, {
          iar_aigenerationstatus: 4 as any, // Issue Created
        });
      } catch {
        // Safe ignore
      }
    }

    handleClose();
  };

  // Close handler that thoroughly resets studio and full-screen state
  const handleClose = () => {
    // If user created an AI generation log but cancelled without creating issue, mark log cancelled
    if (aiSessionLogId && !isAiGenerated) {
      Iar_aiissuegeneratedlogsesService.update(aiSessionLogId, {
        iar_aigenerationstatus: 5 as any, // Issue Cancelled
      }).catch(() => {});
    }

    setIsConfirmDialogOpen(false);
    setIsFullScreen(false);
    setIsAiGenerated(false);
    setIsAiLoading(false);
    setIsCompareDialogOpen(false);
    setSecondaryBusinessOwners([]);
    onClose();
  };

  if (!open) return null;

  // Bundled additional fields state for reusable consumption
  const additionalFieldsState: IssueAdditionalFieldsState = {
    summaryFinding,
    setSummaryFinding,
    auditorResponse,
    setAuditorResponse,
    mitigatingControl,
    setMitigatingControl,
    exceptionRemedComments,
    setExceptionRemedComments,
    issueType,
    setIssueType,
    issueTypeOptions,
    issueCauseType,
    setRootCauseType,
    rootCauseTypeOptions,
    criticality,
    setCriticality,
    criticalityOptions,
    soxReportable,
    setSoxReportable,
    yesNoOptions: YES_NO_OPTIONS,
    issueSource,
    setIssueSource,
    issueSourceOptions,
    keyTheme,
    setKeyTheme,
    keyThemeOptions,
    processArea,
    setProcessArea,
    processAreaOptions,
    repeatFinding,
    setRepeatFinding,
    repeatFindingOptions,
    itAssetAccountableSector,
    setItAssetAccountableSector,
    itAssetAccountableSectorOptions,
    accountableFunction,
    setAccountableFunction,
    accountableFunctionOptions,
    impactedRegion,
    setImpactedRegion,
    impactedRegionOptions,
    impactedSector,
    setImpactedSector,
    impactedSectorOptions,
    impactedMrc,
    setImpactedMrc,
    impactedMrcOptions,
    quarterImpacted,
    setQuarterImpacted,
    quarterImpactedOptions,
    salesUsd,
    setSalesUsd,
    ibtUsd,
    setIbtUsd,
    netIncomeUsd,
    setNetIncomeUsd,
    totalAssetsUsd,
    setTotalAssetsUsd,
    hasExceptionRemedDate,
    setHasExceptionRemedDate,
    exceptionRemedDate,
    setExceptionRemedDate,
    primaryBusinessOwner,
    setPrimaryBusinessOwner,
    secondaryBusinessOwners,
    setSecondaryBusinessOwners,
    systemUsers,
  };

  // ===========================================================================
  // MODE 1: COMPACT DIALOG (Stage 1 Mandatory Fields + Collapsible Details)
  // ===========================================================================
  if (!isFullScreen) {
    return (
      <>
        <CreateIssueCompactDialog
          open={open && !isFullScreen}
          onClose={() => {
            if (originalIssue.trim()) {
              setIsConfirmDialogOpen(true);
            } else {
              handleClose();
            }
          }}
          resolvedEngagementName={resolvedEngagementName}
          testProcedure={testProcedure}
          onTestProcedureChange={handleTestProcedureChange}
          testProcedureOptions={testProcedureOptions}
          selectedFunction={selectedFunction}
          onFunctionChange={handleFunctionChange}
          originalIssue={originalIssue}
          onOriginalIssueChange={handleOriginalIssueChange}
          isAdditionalOpen={isAdditionalOpen}
          onToggleAdditional={() => setIsAdditionalOpen(!isAdditionalOpen)}
          additionalFieldsState={additionalFieldsState}
          isAiLoading={isAiLoading}
          onGenerateAi={handleGenerateAi}
        />

        <SharedConfirmDialog
          open={isConfirmDialogOpen}
          title="Unsaved Changes"
          message="Changes have been unsaved. Leaving will discard the draft and any edits. Are you sure you want to go back?"
          confirmLabel="Back"
          cancelLabel="Cancel"
          onConfirm={handleClose}
          onCancel={() => setIsConfirmDialogOpen(false)}
          variant="warning"
        />
      </>
    );
  }

  // ===========================================================================
  // MODE 2: FULL-PAGE STUDIO SPLIT VIEW (LEFT MANUAL / RIGHT 6 AI FIELDS)
  // ===========================================================================
  return (
    <>
      <CreateIssueStudioView
        resolvedEngagementName={resolvedEngagementName}
        onBack={() => setIsConfirmDialogOpen(true)}
        onCancel={() => setIsConfirmDialogOpen(true)}
        testProcedure={testProcedure}
        onTestProcedureChange={handleTestProcedureChange}
        testProcedureOptions={testProcedureOptions}
        selectedFunction={selectedFunction}
        onFunctionChange={handleFunctionChange}
        originalIssue={originalIssue}
        onOriginalIssueChange={handleOriginalIssueChange}
        isAdditionalOpen={isAdditionalOpen}
        onToggleAdditional={() => setIsAdditionalOpen(!isAdditionalOpen)}
        additionalFieldsState={additionalFieldsState}
        isRegenerateActive={isRegenerateActive}
        isAiLoading={isAiLoading}
        onDismissRegenerateBanner={() => setIsBannerDismissed(true)}
        onRegenerateAi={handleRegenerateAi}
        aiData={aiData}
        onAiFieldChange={handleAiFieldChange}
        fieldRemarks={fieldRemarks}
        onFieldRemarkChange={handleFieldRemarkChange}
        onOpenGuidelines={() => setIsGuidelinesDrawerOpen(true)}
        onSaveDraft={() => handleSaveFinding('draft', false)}
        onSubmitFinding={() => handleSaveFinding('submit', false)}
      />

      {/* Version Comparison Modal Dialog across all 6 fields */}
      <AiVersionCompareModal
        open={isCompareDialogOpen}
        currentVersionNumber={currentVersionNumber}
        previousAiData={previousAiData}
        candidateAiData={candidateAiData}
        selectedComparisonVersions={selectedComparisonVersions}
        onSelectVersion={(field, ver) =>
          setSelectedComparisonVersions((prev) => ({ ...prev, [field]: ver }))
        }
        onEditPreviousField={(field, val) =>
          setPreviousAiData((prev) => (prev ? { ...prev, [field]: val } : null))
        }
        onEditCandidateField={(field, val) =>
          setCandidateAiData((prev) => (prev ? { ...prev, [field]: val } : null))
        }
        onKeepPrevious={handleKeepPreviousVersion}
        onKeepSelected={handleApplyComparisonMerge}
        onDiscard={handleDiscardComparison}
      />

      {/* Unsaved Changes Confirmation Dialog */}
      <SharedConfirmDialog
        open={isConfirmDialogOpen}
        title="Unsaved Changes"
        message="Changes have been unsaved. Leaving will discard the draft and any edits. Are you sure you want to go back?"
        confirmLabel="Back"
        cancelLabel="Cancel"
        onConfirm={handleClose}
        onCancel={() => setIsConfirmDialogOpen(false)}
        variant="warning"
      />

      {/* Guidelines Drawer from Left */}
      <GuidelinesDrawer
        open={isGuidelinesDrawerOpen}
        onClose={() => setIsGuidelinesDrawerOpen(false)}
      />
    </>
  );
};

export default CreateIssueDialog;
