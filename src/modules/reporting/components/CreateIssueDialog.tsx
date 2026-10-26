import React, { useState, useMemo, useEffect } from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import {
  Sparkles,
  X,
  Plus,
  RotateCcw,
  GitCompare,
  Check,
  ChevronDown,
  ChevronUp,
  Cpu,
  Layers,
  AlertTriangle,
  Save,
  Send,
  BookOpen
} from 'lucide-react';
import { GuidelinesDrawer } from './GuidelinesDrawer';
import type { CriticalityLevel, Issue } from '../../../types/dataverse.types';
import {
  SharedTextArea,
  SharedSelect,
  SharedMultiSelect,
  SharedButton,
  SharedFieldLabel,
  SharedTextInput,
  SharedCheckbox,
  AIInput,
  ReferenceComponent,
  SharedConfirmDialog,
  SharedTooltip,
  PageHeader
} from '../../../components/shared';

// Dataverse SDK Services & AI Flows
import { AIIssueGenerationService } from '../../../generated/services/AIIssueGenerationService';
import { Iar_aiissuegeneratedlogsesService } from '../../../generated/services/Iar_aiissuegeneratedlogsesService';
import { Iar_aigeneratedfieldlogsesService } from '../../../generated/services/Iar_aigeneratedfieldlogsesService';
import { SystemusersService } from '../../../generated/services/SystemusersService';

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

// -----------------------------------------------------------------------------
// Controlled Taxonomies & Option Sets (Aligned with J&J Dataverse Schema)
// -----------------------------------------------------------------------------
const CRITICALITY_OPTIONS = [
  { value: 'Critical', label: 'Critical' },
  { value: 'Major', label: 'Major' },
  { value: 'Minor', label: 'Minor' }
];

const PROCESS_AREA_OPTIONS = [
  { value: 'Access Control & IAM', label: 'Access Control & IAM' },
  { value: 'Cybersecurity & Infrastructure', label: 'Cybersecurity & Infrastructure' },
  { value: 'Regulatory Compliance & GxP', label: 'Regulatory Compliance & GxP' },
  { value: 'Supply Chain & Manufacturing', label: 'Supply Chain & Manufacturing' },
  { value: 'Financial Controls & SOX', label: 'Financial Controls & SOX' },
  { value: 'Change Management & DevOps', label: 'Change Management & DevOps' },
  { value: 'Quality Assurance & Calibration', label: 'Quality Assurance & Calibration' },
  { value: 'Catheter Line 3 Electrophysiology', label: 'Catheter Line 3 Electrophysiology' },
  { value: 'Cleanroom HVAC Unit 4', label: 'Cleanroom HVAC Unit 4' }
];

const ROOT_CAUSE_TYPE_OPTIONS = [
  { value: 'Process Gap', label: 'Process Gap' },
  { value: 'System Configuration', label: 'System Configuration' },
  { value: 'Human Oversight', label: 'Human Oversight' },
  { value: 'Third-Party Dependency', label: 'Third-Party Dependency' },
  { value: 'Resource Constraint', label: 'Resource Constraint' },
  { value: 'Operating Effectiveness', label: 'Operating Effectiveness' },
  { value: 'Design Effectiveness', label: 'Design Effectiveness' },
  { value: 'Automated Sensor Calibration Drift', label: 'Automated Sensor Calibration Drift' }
];

const ISSUE_TYPE_OPTIONS = [
  { value: 'Operational', label: 'Operational' },
  { value: 'Compliance', label: 'Compliance' },
  { value: 'Financial / SOX', label: 'Financial / SOX' },
  { value: 'IT / Cybersecurity', label: 'IT / Cybersecurity' },
  { value: 'Regulatory / GxP', label: 'Regulatory / GxP' },
  { value: 'Reputational / Strategic', label: 'Reputational / Strategic' }
];

const ISSUE_SOURCE_OPTIONS = [
  { value: 'Internal Audit', label: 'Internal Audit' },
  { value: 'External Audit (PwC)', label: 'External Audit (PwC)' },
  { value: 'Regulatory Inspection (FDA / ISO)', label: 'Regulatory Inspection (FDA / ISO)' },
  { value: 'Management Self-Identified', label: 'Management Self-Identified' },
  { value: 'Continuous Monitoring Feed', label: 'Continuous Monitoring Feed' }
];

const KEY_THEME_OPTIONS = [
  { value: 'Access Governance & Authorization Matrix', label: 'Access Governance & Authorization Matrix' },
  { value: 'Financial Close & Reporting', label: 'Financial Close & Reporting' },
  { value: 'Manufacturing Telemetry & Calibration', label: 'Manufacturing Telemetry & Calibration' },
  { value: 'Third-Party Vendor Risk', label: 'Third-Party Vendor Risk' },
  { value: 'Change Management & DevOps', label: 'Change Management & DevOps' },
  { value: 'GxP Electronic Records & Data Integrity', label: 'GxP Electronic Records & Data Integrity' }
];

const ACCOUNTABLE_FUNCTION_OPTIONS = [
  { value: 'IT Infrastructure & Identity Access Management', label: 'IT Infrastructure & Identity Access Management' },
  { value: 'Finance Operations & Internal Controls', label: 'Finance Operations & Internal Controls' },
  { value: 'Global Supply Chain & Logistics', label: 'Global Supply Chain & Logistics' },
  { value: 'Quality Assurance & Regulatory Compliance', label: 'Quality Assurance & Regulatory Compliance' },
  { value: 'Commercial & Marketing Operations', label: 'Commercial & Marketing Operations' },
  { value: 'Research & Development (R&D)', label: 'Research & Development (R&D)' }
];

const IT_ASSET_ACCOUNTABLE_SECTOR_OPTIONS = [
  { value: 'MT', label: 'MT (MedTech)' },
  { value: 'IM', label: 'IM (Innovative Medicine)' },
  { value: 'Consumer Health', label: 'Consumer Health' },
  { value: 'CORP', label: 'CORP (Corporate Enterprise)' },
  { value: 'ISRM', label: 'ISRM (InfoSec Risk Management)' },
  { value: 'TS', label: 'TS (Technology Services)' }
];

const IMPACTED_REGION_OPTIONS = [
  { value: 'NA', label: 'NA (North America)' },
  { value: 'EMEA', label: 'EMEA (Europe, Middle East, Africa)' },
  { value: 'LATAM', label: 'LATAM (Latin America)' },
  { value: 'APAC', label: 'APAC (Asia Pacific)' }
];

const IMPACTED_SECTOR_OPTIONS = [
  { value: 'MED', label: 'MED (Medical Devices)' },
  { value: 'PHR', label: 'PHR (Pharmaceuticals)' },
  { value: 'CPC', label: 'CPC' },
  { value: 'GS-NOP', label: 'GS-NOP' },
  { value: 'NOP', label: 'NOP' },
  { value: 'Ortho_Synthes', label: 'Ortho_Synthes' }
];

const IMPACTED_MRC_OPTIONS = [
  { value: 'MRC-01: Global Supply Chain & Manufacturing Operations', label: 'MRC-01: Supply Chain & Manufacturing' },
  { value: 'MRC-02: Commercial Operations & Revenue Assurance', label: 'MRC-02: Commercial Operations' },
  { value: 'MRC-03: Research & Development', label: 'MRC-03: Research & Development' },
  { value: 'MRC-04: Global Shared Services & Global Functions', label: 'MRC-04: Global Shared Services' },
  { value: 'MRC-05: Treasury & Capital Management', label: 'MRC-05: Treasury & Capital' }
];

const QUARTER_IMPACTED_OPTIONS = [
  { value: 'Q1 2026', label: 'Q1 2026' },
  { value: 'Q2 2026', label: 'Q2 2026' },
  { value: 'Q3 2026', label: 'Q3 2026' },
  { value: 'Q4 2026', label: 'Q4 2026' },
  { value: 'Q1 2025', label: 'Q1 2025' },
  { value: 'Q2 2025', label: 'Q2 2025' },
  { value: 'Q3 2025', label: 'Q3 2025' },
  { value: 'Q4 2025', label: 'Q4 2025' }
];

const YES_NO_OPTIONS = [
  { value: 'No', label: 'No' },
  { value: 'Yes', label: 'Yes' }
];

interface TestProcedureOption {
  value: string;
  label: string;
  function: string;
  id?: string;
}

const DEFAULT_TEST_PROCEDURES: TestProcedureOption[] = [
  { value: 'TP-101', label: 'TP-101: User Access & Authentication Review', function: 'IT' },
  { value: 'TP-102', label: 'TP-102: Privileged Access Management Verification', function: 'IT' },
  { value: 'TP-103', label: 'TP-103: Automated Telemetry & Calibration Logging Review', function: 'IT' },
  { value: 'TP-104', label: 'TP-104: Segregation of Duties & Authorization Matrix', function: 'FinOps' },
  { value: 'TP-105', label: 'TP-105: Third-Party Vendor Network Deprovisioning', function: 'IT' },
  { value: 'TP-106', label: 'TP-106: Inventory Scrap & Variance Reconciliation', function: 'FinOps' },
  { value: 'TP-107', label: 'TP-107: Cleanroom Environmental HVAC Controls', function: 'FinOps' },
  { value: 'TP-110', label: 'TP-110: GxP Software Validation & Data Integrity Audit', function: 'IT' }
];

// 6 Core AI Synthesis Fields
interface AiFields {
  updatedIssueHeader: string;
  description: string;
  rootCause: string;
  impact: string;
  recommendation: string;
  nonComplianceReferences: string;
}

export const CreateIssueDialog: React.FC<CreateIssueDialogProps> = ({
  open,
  onClose,
  engagementId,
  engagementName,
  job,
  defaultFunction = 'IT',
  userRole = 'Staff Auditor',
  currentUser,
  onSave
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

  // Dynamic Test Procedures loaded from the active engagement
  const testProcedureOptions: TestProcedureOption[] = useMemo(() => {
    if (job?.testProcedures && Array.isArray(job.testProcedures) && job.testProcedures.length > 0) {
      return job.testProcedures.map((tp: any) => ({
        value: tp.code || tp.id,
        label: tp.name ? `${tp.code || tp.id}: ${tp.name}` : (tp.fullName || tp.code || tp.id),
        function: tp.function || 'IT',
        id: tp.id
      }));
    }
    return DEFAULT_TEST_PROCEDURES;
  }, [job]);

  // Live System Users for Primary Business Owner
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
            label: u.fullname || u.name || u.internalemailaddress || 'Corporate User'
          }));
          setSystemUsers(userOpts);
        } else {
          setSystemUsers([
            { value: 'user-01', label: 'Vinay Narasimha (Lead Business Owner)' },
            { value: 'user-02', label: 'Rachel Green (FinOps Lead)' },
            { value: 'user-03', label: 'Marcus Vance (Quality Audit)' },
            { value: 'user-04', label: 'Sarah Jenkins (IT Lead)' }
          ]);
        }
      })
      .catch(() => {
        if (isSubscribed) {
          setSystemUsers([
            { value: 'user-01', label: 'Vinay Narasimha (Lead Business Owner)' },
            { value: 'user-02', label: 'Rachel Green (FinOps Lead)' },
            { value: 'user-03', label: 'Marcus Vance (Quality Audit)' },
            { value: 'user-04', label: 'Sarah Jenkins (IT Lead)' }
          ]);
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [open]);

  // ---------------------------------------------------------------------------
  // Stage 1 Mandatory Fields State
  // ---------------------------------------------------------------------------
  const [testProcedure, setTestProcedure] = useState<string>(testProcedureOptions[0]?.value || 'TP-101');
  const [originalIssue, setOriginalIssue] = useState<string>('');
  const [selectedFunction, setSelectedFunction] = useState<'IT' | 'FinOps'>(defaultFunction);

  // ---------------------------------------------------------------------------
  // Stage 2 Extended & Additional Fields State
  // ---------------------------------------------------------------------------
  const [isAdditionalOpen, setIsAdditionalOpen] = useState(false);

  // Governance & Ownership
  const [primaryBusinessOwner, setPrimaryBusinessOwner] = useState<string>('');
  const [secondaryBusinessOwners, setSecondaryBusinessOwners] = useState<string[]>([]);
  const [accountableFunction, setAccountableFunction] = useState<string>(
    'IT Infrastructure & Identity Access Management'
  );

  // Classifications & Taxonomies
  const [criticality, setCriticality] = useState<CriticalityLevel>('Major');
  const [processArea, setProcessArea] = useState<string>('Access Control & IAM');
  const [issueType, setIssueType] = useState<string>('Compliance');
  const [issueCauseType, setRootCauseType] = useState<string>('Process Gap');
  const [issueSource, setIssueSource] = useState<string>('Internal Audit');
  const [keyTheme, setKeyTheme] = useState<string>('Access Governance & Authorization Matrix');
  const [repeatFinding, setRepeatFinding] = useState<'No' | 'Yes'>('No');
  const [soxReportable, setSoxReportable] = useState<'No' | 'Yes'>('No');

  // Enterprise Scope
  const [impactedRegion, setImpactedRegion] = useState<string>('NA');
  const [impactedSector, setImpactedSector] = useState<string>('MED');
  const [impactedMrc, setImpactedMrc] = useState<string>(
    'MRC-01: Global Supply Chain & Manufacturing Operations'
  );
  const [itAssetAccountableSector, setItAssetAccountableSector] = useState<string>('MT');
  const [quarterImpacted, setQuarterImpacted] = useState<string>('Q1 2026');

  // Financial Metrics (USD)
  const [salesUsd, setSalesUsd] = useState<string>('');
  const [ibtUsd, setIbtUsd] = useState<string>('');
  const [netIncomeUsd, setNetIncomeUsd] = useState<string>('');
  const [totalAssetsUsd, setTotalAssetsUsd] = useState<string>('');

  // Extended Narratives & Exception Remediation
  const [summaryFinding, setSummaryFinding] = useState<string>('');
  const [mitigatingControl, setMitigatingControl] = useState<string>('');
  const [auditorResponse, setAuditorResponse] = useState<string>('');
  const [exceptionRemedComments, setExceptionRemedComments] = useState<string>('');
  const [hasExceptionRemedDate, setHasExceptionRemedDate] = useState<boolean>(false);
  const [exceptionRemedDate, setExceptionRemedDate] = useState<string>('');

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
    nonComplianceReferences: ''
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
    nonComplianceReferences: 'candidate'
  });

  // Field-level remarks for AI fine-tuning
  const [fieldRemarks, setFieldRemarks] = useState<Record<keyof AiFields, string>>({
    updatedIssueHeader: '',
    description: '',
    rootCause: '',
    impact: '',
    recommendation: '',
    nonComplianceReferences: ''
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

  // Reset form when dialog opens/closes
  useEffect(() => {
    if (open) {
      setTestProcedure(testProcedureOptions[0]?.value || 'TP-101');
      setOriginalIssue('');
      setSelectedFunction(defaultFunction);
      setIsAdditionalOpen(false);
      setPrimaryBusinessOwner('');
      setAccountableFunction(
        defaultFunction === 'FinOps'
          ? 'Finance Operations & Internal Controls'
          : 'IT Infrastructure & Identity Access Management'
      );
      setCriticality('Major');
      setProcessArea('Access Control & IAM');
      setIssueType('Compliance');
      setRootCauseType('Process Gap');
      setIssueSource('Internal Audit');
      setKeyTheme('Access Governance & Authorization Matrix');
      setRepeatFinding('No');
      setSoxReportable('No');
      setImpactedRegion('NA');
      setImpactedSector('MED');
      setImpactedMrc('MRC-01: Global Supply Chain & Manufacturing Operations');
      setItAssetAccountableSector('MT');
      setQuarterImpacted('Q1 2026');
      setSalesUsd('');
      setIbtUsd('');
      setNetIncomeUsd('');
      setTotalAssetsUsd('');
      setSummaryFinding('');
      setMitigatingControl('');
      setAuditorResponse('');
      setExceptionRemedComments('');
      setHasExceptionRemedDate(false);
      setExceptionRemedDate('');
      setPrimaryBusinessOwner('');
      setSecondaryBusinessOwners([]);
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
        nonComplianceReferences: ''
      });
      setFieldRemarks({
        updatedIssueHeader: '',
        description: '',
        rootCause: '',
        impact: '',
        recommendation: '',
        nonComplianceReferences: ''
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
      updatedIssueHeader: `${procCode}: Inadequate Controls over ${procTitle}${headerRemark}`,
      description: `During field audit testing of ${procTitle} for the ${resolvedEngagementName} environment, audit identified that ${issueText.trim()}.\n\nApplicable Standard Citation: Under Johnson & Johnson ${citation} (${stdCode}), operational environments must maintain continuous verifiable evidence of compliance.${descRemark}`,
      rootCause: `Systemic governance and automated synchronization gaps in ${processArea}. Root cause analysis indicates lack of scheduled exception monitoring feeds and absence of secondary verification protocols under the ${func} operating model.${rootRemark}`,
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
            file_id: 'FILE-001'
          }
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
            file_id: 'FILE-002'
          }
        }
      ])
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
          quarterImpacted
        }),
        'iar_EngagementID@odata.bind': cleanEngId.includes('-')
          ? `/iar_engagementses(${cleanEngId})`
          : undefined as any,
        statecode: 0 as any,
        statuscode: 1 as any
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
          accountableFunction
        })
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
            nonComplianceReferences: typeof resp.non_compliance_references === 'string'
              ? resp.non_compliance_references
              : JSON.stringify(resp.non_compliance_references || '')
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
          { name: 6, text: synthesizedResult.nonComplianceReferences }
        ];

        for (const snap of fieldSnapshots) {
          await Iar_aigeneratedfieldlogsesService.create({
            iar_aigeneratedfieldlogid: `FLD-${Date.now().toString().slice(-6)}-${snap.name}`,
            iar_aigeneratedtext: snap.text,
            iar_fieldname: snap.name as any,
            iar_remark: fieldRemarks[
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
            statuscode: 1 as any
          });
        }

        // Update parent log status to Success (2)
        await Iar_aiissuegeneratedlogsesService.update(createdParentLogId, {
          iar_aigenerationstatus: 2 as any
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
      selectedFunction
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
          remarks: fieldRemarks
        })
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
            nonComplianceReferences: typeof resp.non_compliance_references === 'string'
              ? resp.non_compliance_references
              : JSON.stringify(resp.non_compliance_references || '')
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
      nonComplianceReferences: 'candidate'
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
          : previousAiData.nonComplianceReferences
    };

    setAiData(merged);
    setCurrentVersionNumber((prev) => prev + 1);
    setLastGeneratedParams({
      testProcedure,
      originalIssue,
      selectedFunction
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
      selectedFunction
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
      selectedFunction
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
    const r = (userRole || '').toLowerCase();
    const isTC = r.includes('coordinator') || r.includes('tc');
    const isManager = r.includes('manager') && !r.includes('director');
    const isDirector = r.includes('director');

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

    // Call onSave with all 31 fields populated
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
        rootCause: aiData.rootCause.trim() || `${issueCauseType} identified during fieldwork.`,
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
        workflowRemarks: `Initial creation by ${currentUser?.name || userRole}`
      },
      action
    );

    // If session log was active, mark accepted
    if (aiSessionLogId) {
      try {
        await Iar_aiissuegeneratedlogsesService.update(aiSessionLogId, {
          iar_aigenerationstatus: 4 as any // Issue Created
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
        iar_aigenerationstatus: 5 as any // Issue Cancelled
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

  // ---------------------------------------------------------------------------
  // Reusable Additional Fields Render Section (Shared by Mode 1 & Mode 2)
  // ---------------------------------------------------------------------------
  const renderAdditionalFieldsContent = (isNested = false) => (
    <div
      style={{
        backgroundColor: isNested ? 'transparent' : '#FAFAFA',
        border: isNested ? 'none' : '1px solid #EAEAEA',
        borderRadius: isNested ? '0' : '8px',
        padding: isNested ? '0' : '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '12px',
        animation: 'fadeIn 0.2s ease'
      }}
    >
      {/* 1. Summary Finding Executive Summary */}
      <SharedTextArea
        label="Summary Finding Executive Summary"
        value={summaryFinding}
        onChange={setSummaryFinding}
        placeholder="Brief executive summary narrative of finding..."
        rows={2}
      />

      {/* 2. Auditor Response */}
      <SharedTextArea
        label="Auditor Response"
        value={auditorResponse}
        onChange={setAuditorResponse}
        placeholder="Auditor validation or initial assessment notes..."
        rows={2}
      />

      {/* 3. Mitigating Control */}
      <SharedTextArea
        label="Mitigating Control"
        value={mitigatingControl}
        onChange={setMitigatingControl}
        placeholder="Existing compensating controls in place..."
        rows={2}
      />

      {/* 4. Exception Remediation Comments */}
      <SharedTextArea
        label="Exception Remediation Comments"
        value={exceptionRemedComments}
        onChange={setExceptionRemedComments}
        placeholder="Remediation timeline comments..."
        rows={2}
      />

      {/* 5. Issue Type & 6. Issue Cause Type */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <SharedSelect
          label="Issue Type"
          value={issueType}
          onChange={setIssueType}
          options={ISSUE_TYPE_OPTIONS}
        />
        <SharedSelect
          label="Issue Cause Type"
          value={issueCauseType}
          onChange={setRootCauseType}
          options={ROOT_CAUSE_TYPE_OPTIONS}
        />
      </div>

      {/* 7. Criticality & 8. SOX Reportable */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <SharedSelect
          label="Criticality"
          value={criticality}
          onChange={(v) => setCriticality(v as CriticalityLevel)}
          options={CRITICALITY_OPTIONS}
        />
        <SharedSelect
          label="SOX Reportable"
          value={soxReportable}
          onChange={(v) => setSoxReportable(v as 'No' | 'Yes')}
          options={YES_NO_OPTIONS}
        />
      </div>

      {/* 9. Issue Finding Source & 10. Key Theme */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <SharedSelect
          label="Issue Finding Source"
          value={issueSource}
          onChange={setIssueSource}
          options={ISSUE_SOURCE_OPTIONS}
        />
        <SharedSelect
          label="Key Theme"
          value={keyTheme}
          onChange={setKeyTheme}
          options={KEY_THEME_OPTIONS}
        />
      </div>

      {/* 11. Area & 12. Repeat Finding */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <SharedSelect
          label="Area"
          value={processArea}
          onChange={setProcessArea}
          options={PROCESS_AREA_OPTIONS}
        />
        <SharedSelect
          label="Repeat Finding"
          value={repeatFinding}
          onChange={(v) => setRepeatFinding(v as 'No' | 'Yes')}
          options={YES_NO_OPTIONS}
        />
      </div>

      {/* 13. IT Asset Accountable Sector & 14. Accountable Function */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <SharedSelect
          label="IT Asset Accountable Sector"
          value={itAssetAccountableSector}
          onChange={setItAssetAccountableSector}
          options={IT_ASSET_ACCOUNTABLE_SECTOR_OPTIONS}
        />
        <SharedSelect
          label="Accountable Function"
          value={accountableFunction}
          onChange={(v) => setAccountableFunction(v as string)}
          options={ACCOUNTABLE_FUNCTION_OPTIONS}
        />
      </div>

      {/* 15. Impacted Region & 16. Impacted Sector */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <SharedSelect
          label="Impacted Region"
          value={impactedRegion}
          onChange={setImpactedRegion}
          options={IMPACTED_REGION_OPTIONS}
        />
        <SharedSelect
          label="Impacted Sector"
          value={impactedSector}
          onChange={setImpactedSector}
          options={IMPACTED_SECTOR_OPTIONS}
        />
      </div>

      {/* 17. Impact MRC & 18. Quarter Impacted */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <SharedSelect
          label="Impact MRC"
          value={impactedMrc}
          onChange={setImpactedMrc}
          options={IMPACTED_MRC_OPTIONS}
        />
        <SharedSelect
          label="Quarter Impacted"
          value={quarterImpacted}
          onChange={setQuarterImpacted}
          options={QUARTER_IMPACTED_OPTIONS}
        />
      </div>

      {/* 19. Sales (USD) & 20. IBT (USD) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <SharedTextInput
          label="Sales (USD)"
          value={salesUsd}
          onChange={(val) => setSalesUsd(val)}
          placeholder="$0.00"
        />
        <SharedTextInput
          label="IBT (USD)"
          value={ibtUsd}
          onChange={(val) => setIbtUsd(val)}
          placeholder="$0.00"
        />
      </div>

      {/* 21. Net Income (USD) & 22. Total Assets (USD) */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
        <SharedTextInput
          label="Net Income (USD)"
          value={netIncomeUsd}
          onChange={(val) => setNetIncomeUsd(val)}
          placeholder="$0.00"
        />
        <SharedTextInput
          label="Total Assets (USD)"
          value={totalAssetsUsd}
          onChange={(val) => setTotalAssetsUsd(val)}
          placeholder="$0.00"
        />
      </div>

      {/* 23. Exception Remediation Date */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingTop: '4px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <SharedCheckbox
            checked={hasExceptionRemedDate}
            onChange={(checked) => setHasExceptionRemedDate(checked)}
            label="Enable Exception Remediation Date"
          />
        </div>
        {hasExceptionRemedDate && (
          <div style={{ maxWidth: '280px' }}>
            <SharedTextInput
              label="Exception Remediation Date"
              type="date"
              value={exceptionRemedDate}
              onChange={(val) => setExceptionRemedDate(val)}
            />
          </div>
        )}
      </div>

      {/* 24. Primary Business Owner */}
      <SharedSelect
        label="Primary Business Owner"
        value={primaryBusinessOwner}
        onChange={(v) => setPrimaryBusinessOwner(v as string)}
        options={systemUsers}
        placeholder="Select Primary Business Owner..."
      />

      {/* 25. Add New Secondary Business Owner (Multi Select) */}
      <SharedMultiSelect
        label="Add New Secondary Business Owner"
        value={secondaryBusinessOwners}
        onChange={(vals) => setSecondaryBusinessOwners(vals)}
        options={systemUsers}
        placeholder="Select Secondary Business Owners..."
      />
    </div>
  );

  // ===========================================================================
  // MODE 1: COMPACT DIALOG (Stage 1 Mandatory Fields + Collapsible Details)
  // ===========================================================================
  if (!isFullScreen) {
    return (
      <>
        <Dialog
          open={open && !isFullScreen}
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
              flexDirection: 'column'
            }
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
                  borderRadius: '8px'
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
                    boxShadow: '0 4px 12px rgba(0, 0, 153, 0.08)'
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
                flexShrink: 0
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
                      color: '#000099'
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
                  onClick={() => {
                    if (originalIssue.trim()) {
                      setIsConfirmDialogOpen(true);
                    } else {
                      handleClose();
                    }
                  }}
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
                    transition: 'all 0.15s ease'
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
                overflowY: 'auto'
              }}
            >
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px', paddingTop: '2px' }}>
                {/* Stage 1 Row 1: Test Procedure (col 1) & Function (col 2) */}
                <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '16px', alignItems: 'flex-start' }}>
                  <div>
                    <SharedSelect
                      label="Test Procedure"
                      value={testProcedure}
                      onChange={(val) => handleTestProcedureChange(val as string)}
                      options={testProcedureOptions.map((opt) => ({
                        value: opt.value,
                        label: opt.label
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
                        onClick={() => setSelectedFunction('IT')}
                        style={{
                          flex: 1,
                          height: '36px',
                          fontSize: '12px',
                          fontWeight: 700,
                          backgroundColor: selectedFunction === 'IT' ? '#EFF6FF' : '#FFFFFF',
                          color: selectedFunction === 'IT' ? '#000099' : '#475569',
                          borderColor: selectedFunction === 'IT' ? '#000099' : '#CBD5E1'
                        }}
                      >
                        IT
                      </SharedButton>

                      <SharedButton
                        type="button"
                        variant={selectedFunction === 'FinOps' ? 'primary' : 'outline'}
                        size="small"
                        startIcon={<Layers size={14} />}
                        onClick={() => setSelectedFunction('FinOps')}
                        style={{
                          flex: 1,
                          height: '36px',
                          fontSize: '12px',
                          fontWeight: 700,
                          backgroundColor: selectedFunction === 'FinOps' ? '#EFF6FF' : '#FFFFFF',
                          color: selectedFunction === 'FinOps' ? '#000099' : '#475569',
                          borderColor: selectedFunction === 'FinOps' ? '#000099' : '#CBD5E1'
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
                    onChange={setOriginalIssue}
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
                    onClick={() => setIsAdditionalOpen(!isAdditionalOpen)}
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
                      fontFamily: '"jj-circular", Arial, Helvetica, sans-serif'
                    }}
                  >
                    <span>Additional Fields</span>
                    {isAdditionalOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                  </button>
                </div>

                {/* Collapsed Fields Section (21 Missing Fields Grouped) */}
                {isAdditionalOpen && renderAdditionalFieldsContent()}
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
                gap: '10px'
              }}
            >
              <SharedButton
                variant="outline"
                onClick={() => {
                  if (originalIssue.trim()) {
                    setIsConfirmDialogOpen(true);
                  } else {
                    handleClose();
                  }
                }}
              >
                Cancel
              </SharedButton>

              <SharedTooltip
                title="Uses generative AI to automatically synthesize the finding title, detailed description, root cause, impact, recommendations, and compliance references from the selected test procedure and original issue notes."
                placement="top"
              >
                <SharedButton
                  variant="primary"
                  startIcon={<Sparkles size={15} />}
                  onClick={handleGenerateAi}
                  disabled={!originalIssue.trim() || !testProcedure || isAiLoading}
                >
                  Generate with AI
                </SharedButton>
              </SharedTooltip>
            </DialogActions>
          </div>
        </Dialog>

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
        overflow: 'hidden'
      }}
    >
      {/* Standardized Studio Header Toolbar */}
      <PageHeader
        onBack={() => setIsConfirmDialogOpen(true)}
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
          position: 'relative'
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
            boxSizing: 'border-box'
          }}
        >
          <div
            style={{
              padding: '24px 24px 40px 24px',
              display: 'flex',
              flexDirection: 'column',
              gap: '18px'
            }}
          >
            {/* Row 1: Test Procedure & Function */}
          <div style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.75fr', gap: '16px', alignItems: 'flex-start' }}>
            <div>
              <SharedSelect
                label="Test Procedure"
                value={testProcedure}
                onChange={(val) => handleTestProcedureChange(val as string)}
                options={testProcedureOptions.map((opt) => ({
                  value: opt.value,
                  label: opt.label
                }))}
                required
              />
            </div>

            <div>
              <SharedFieldLabel label="Function" required />
              <div style={{ display: 'flex', gap: '8px', marginTop: '6px' }}>
                <button
                  type="button"
                  onClick={() => handleFunctionChange('IT')}
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
                    gap: '6px'
                  }}
                >
                  <Cpu size={14} />
                  <span>IT</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleFunctionChange('FinOps')}
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
                    gap: '6px'
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
              onChange={handleOriginalIssueChange}
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
              overflow: 'hidden'
            }}
          >
            <button
              type="button"
              onClick={() => setIsAdditionalOpen(!isAdditionalOpen)}
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
                color: '#334155'
              }}
            >
              <span>Additional Fields</span>
              {isAdditionalOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            </button>

            {isAdditionalOpen && (
              <div style={{ padding: '14px', borderTop: '1px solid #EAEAEA' }}>
                {renderAdditionalFieldsContent(true)}
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
            flexDirection: 'column'
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
              overflow: 'hidden'
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
                gap: '16px'
              }}
            >
              {/* Always-Visible Regeneration Container */}
              <div
                style={{
                  backgroundColor: isRegenerateActive ? '#EFF6FF' : '#F8FAFC',
                  border: isRegenerateActive ? '1px solid #BFDBFE' : '1px solid #E2E8F0',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '14px',
                  boxShadow: isRegenerateActive ? '0 1px 3px rgba(0, 0, 153, 0.08)' : 'none',
                  transition: 'all 0.2s ease',
                  flexShrink: 0
                }}
              >
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flex: 1 }}>
                  <div
                    style={{
                      width: '28px',
                      height: '28px',
                      borderRadius: '50%',
                      backgroundColor: isRegenerateActive ? '#DBEAFE' : '#F1F5F9',
                      border: isRegenerateActive ? '1px solid #93C5FD' : '1px solid #CBD5E1',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: isRegenerateActive ? '#000099' : '#94A3B8',
                      flexShrink: 0
                    }}
                  >
                    {isRegenerateActive ? <AlertTriangle size={15} /> : <RotateCcw size={14} />}
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: '12.5px',
                        color: isRegenerateActive ? '#1E3A8A' : '#64748B',
                        lineHeight: 1.45,
                        fontWeight: isRegenerateActive ? 600 : 400
                      }}
                    >
                      {isRegenerateActive
                        ? 'Changed the original issue or function, so generated AI might not be aligned. Please click Regenerate AI if needed.'
                        : 'Change the function or issue to regenerate'}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                  {isRegenerateActive && (
                    <SharedButton
                      variant="outline"
                      size="small"
                      onClick={() => setIsBannerDismissed(true)}
                      style={{ minHeight: '1.75rem', fontSize: '11.5px', padding: '0 12px' }}
                    >
                      Cancel
                    </SharedButton>
                  )}

                  <SharedButton
                    variant={isRegenerateActive ? 'primary' : 'outline'}
                    size="small"
                    startIcon={<RotateCcw size={12} />}
                    onClick={handleRegenerateAi}
                    disabled={!isRegenerateActive || isAiLoading}
                    loading={isAiLoading}
                    style={
                      !isRegenerateActive
                        ? {
                            opacity: 0.6,
                            borderColor: '#CBD5E1',
                            color: '#94A3B8',
                            cursor: 'not-allowed',
                            backgroundColor: '#F8FAFC'
                          }
                        : undefined
                    }
                  >
                    {isAiLoading ? 'Regenerating...' : 'Regenerate AI'}
                  </SharedButton>
                </div>
              </div>

              {/* 6 Core AI Fields */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Field 1: Issue Title */}
                <AIInput
                  label="Issue Title"
                  value={aiData.updatedIssueHeader}
                  onChange={(v) => handleAiFieldChange('updatedIssueHeader', v)}
                  remark={fieldRemarks.updatedIssueHeader}
                  onRemarkChange={(r) => handleFieldRemarkChange('updatedIssueHeader', r)}
                  rows={2}
                  required
                  isAiLoading={isAiLoading}
                  placeholder="AI generated finding headline..."
                />

                {/* Field 2: Description */}
                <AIInput
                  label="Description / Condition Narrative"
                  value={aiData.description}
                  onChange={(v) => handleAiFieldChange('description', v)}
                  remark={fieldRemarks.description}
                  onRemarkChange={(r) => handleFieldRemarkChange('description', r)}
                  rows={4}
                  required
                  isAiLoading={isAiLoading}
                  placeholder="Synthesized condition narrative and standard citations..."
                />

                {/* Field 3: Root Cause */}
                <AIInput
                  label="Root Cause"
                  value={aiData.rootCause}
                  onChange={(v) => handleAiFieldChange('rootCause', v)}
                  remark={fieldRemarks.rootCause}
                  onRemarkChange={(r) => handleFieldRemarkChange('rootCause', r)}
                  rows={3}
                  required
                  isAiLoading={isAiLoading}
                  placeholder="Underlying operational or technical root cause gap..."
                />

                {/* Field 4: Impact */}
                <AIInput
                  label="Impact & Exposure"
                  value={aiData.impact}
                  onChange={(v) => handleAiFieldChange('impact', v)}
                  remark={fieldRemarks.impact}
                  onRemarkChange={(r) => handleFieldRemarkChange('impact', r)}
                  rows={3}
                  required
                  isAiLoading={isAiLoading}
                  placeholder="Compliance, financial, or data integrity impact..."
                />

                {/* Field 5: Recommendations */}
                <AIInput
                  label="Recommendations"
                  value={aiData.recommendation}
                  onChange={(v) => handleAiFieldChange('recommendation', v)}
                  remark={fieldRemarks.recommendation}
                  onRemarkChange={(r) => handleFieldRemarkChange('recommendation', r)}
                  rows={3}
                  required
                  isAiLoading={isAiLoading}
                  placeholder="Numbered corrective action recommendations..."
                />

                {/* Field 6: References */}
                <ReferenceComponent
                  label="References"
                  value={aiData.nonComplianceReferences}
                  onChange={(v) => handleAiFieldChange('nonComplianceReferences', v)}
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
          flexShrink: 0
        }}
      >
        <SharedButton variant="outline" onClick={() => setIsConfirmDialogOpen(true)}>
          Cancel
        </SharedButton>

        <SharedTooltip title="View field-by-field drafting guidelines, PEF compliance, and acronym definitions" placement="top">
          <span>
            <SharedButton
              variant="outline"
              startIcon={<BookOpen size={14} />}
              onClick={() => setIsGuidelinesDrawerOpen(true)}
              style={{
                borderColor: '#000099',
                color: '#000099',
                fontWeight: 600
              }}
            >
              Show Guidelines
            </SharedButton>
          </span>
        </SharedTooltip>

        <SharedTooltip title="Save finding as draft in current reviewer tier" placement="top">
          <span>
            <SharedButton
              variant="outline"
              startIcon={<Save size={14} />}
              onClick={() => handleSaveFinding('draft', false)}
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
              onClick={() => handleSaveFinding('submit', false)}
              disabled={isAiLoading}
            >
              Submit Finding
            </SharedButton>
          </span>
        </SharedTooltip>
      </div>

      {/* Version Comparison Modal Dialog across all 6 fields */}
      <Dialog
        open={isCompareDialogOpen}
        onClose={handleDiscardComparison}
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
            flexDirection: 'column'
          }
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
            gap: '12px'
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
                color: '#15803D'
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
            <SharedButton type="button" variant="outline" size="small" onClick={handleKeepPreviousVersion}>
              Keep Previous
            </SharedButton>

            <SharedButton
              type="button"
              variant="success"
              size="small"
              startIcon={<Check size={14} />}
              onClick={handleApplyComparisonMerge}
            >
              Keep Selected
            </SharedButton>

            <SharedButton
              type="button"
              variant="outline"
              size="small"
              startIcon={<X size={13} />}
              onClick={handleDiscardComparison}
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
            backgroundColor: '#F8FAFC'
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

                {[
                  { key: 'updatedIssueHeader' as const, label: 'Issue Title', rows: 2 },
                  { key: 'description' as const, label: 'Description', rows: 4 },
                  { key: 'rootCause' as const, label: 'Root Cause', rows: 3 },
                  { key: 'impact' as const, label: 'Impact & Exposure', rows: 3 },
                  { key: 'recommendation' as const, label: 'Recommendations', rows: 3 },
                  { key: 'nonComplianceReferences' as const, label: 'References', rows: 3 }
                ].map(({ key, label, rows }) => {
                  const prevText = previousAiData[key] || '';
                  const candidateText = candidateAiData[key] || '';
                  const choice = selectedComparisonVersions[key];

                  return (
                    <div
                      key={key}
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '8px'
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
                              borderRadius: '4px'
                            }}
                          >
                            {choice === 'candidate' ? 'Regenerated' : 'Previous'}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        {/* Previous Version Single Input Box */}
                        <textarea
                          value={prevText}
                          rows={rows}
                          onClick={() =>
                            setSelectedComparisonVersions((prev) => ({ ...prev, [key]: 'previous' }))
                          }
                          onFocus={() => {
                            setSelectedComparisonVersions((prev) => ({ ...prev, [key]: 'previous' }));
                          }}
                          onChange={(e) => {
                            const val = e.target.value;
                            setPreviousAiData((prev) => (prev ? { ...prev, [key]: val } : null));
                            setSelectedComparisonVersions((prev) => ({ ...prev, [key]: 'previous' }));
                          }}
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
                            boxShadow: choice === 'previous' ? '0 0 0 1px #16A34A, 0 1px 4px rgba(22, 163, 74, 0.12)' : 'none',
                            transition: 'all 0.15s ease',
                            cursor: 'text'
                          }}
                          placeholder="Previous version..."
                        />

                        {/* Regenerated Candidate Single Input Box */}
                        <textarea
                          value={candidateText}
                          rows={rows}
                          onClick={() =>
                            setSelectedComparisonVersions((prev) => ({ ...prev, [key]: 'candidate' }))
                          }
                          onFocus={() => {
                            setSelectedComparisonVersions((prev) => ({ ...prev, [key]: 'candidate' }));
                          }}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCandidateAiData((prev) => (prev ? { ...prev, [key]: val } : null));
                            setSelectedComparisonVersions((prev) => ({ ...prev, [key]: 'candidate' }));
                          }}
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
                            boxShadow: choice === 'candidate' ? '0 0 0 1px #16A34A, 0 1px 4px rgba(22, 163, 74, 0.12)' : 'none',
                            transition: 'all 0.15s ease',
                            cursor: 'text'
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
    </div>
  );
};

export default CreateIssueDialog;
