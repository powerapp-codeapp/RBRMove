export type CriticalityLevel = 'Critical' | 'Major' | 'Moderate' | 'Minor' | 'Informational';

export type IssueStatus =
  | 'Pending Staff'
  | 'Pending TC'
  | 'In progress TC'
  | 'Pending Manager'
  | 'Pending with Business'
  | 'Manager Completed'
  | 'Ready for Director Submission'
  | 'Pending Director'
  | 'Pending VP'
  | 'Completed'
  | 'Signed Off'
  | 'Called Back'
  | 'Excluded'
  | 'Not My Function Issue';

export type EngagementStatus =
  | 'Not Started'
  | 'Audit Report In Progress'
  | 'Executive Report In Progress'
  | 'Completed';

export interface Assessment {
  assessmentId: string;
  name: string;
  year: number;
  status: 'Open' | 'Closed' | 'Re-Opened';
}

export interface Engagement {
  id: string;
  reportId: string;
  assessmentId: string;
  title: string;
  engagement: string;
  domain: 'IT' | 'FinOps';
  leadAuditor: string;
  status: EngagementStatus;
  subStatus?: string;
  criticality: CriticalityLevel;
  totalIssuesCount?: number;
  criticalIssuesCount?: number;
  plantLocation?: string;
  businessUnit?: string;
  lastUpdated?: string;
}

export interface Assignment {
  assignmentId: string;
  engagementId: string;
  role: string;
  userIds: string[];
}

export interface TestProcedure {
  id: string;
  code: string;
  title: string;
  domain: string;
  engagementId?: string;
}

export interface IssueLock {
  isLocked: boolean;
  lockedBy: {
    userId?: string;
    name: string;
    email?: string;
    role: string;
    avatar?: string;
    avatarBg?: string;
    timestamp?: string;
    activity?: string;
  } | null;
  lockedAt: string | null;
}

export interface Issue {
  id: string;
  jobId?: string;
  engagementId: string;
  testProcedureCode: string;
  testProcedureId?: string;
  testProcedureTitle?: string;
  title: string;
  header?: string;
  criticality: CriticalityLevel;
  status: IssueStatus;
  reportRef?: number;
  
  // Workpaper Narrative Content
  description?: string;
  originalIssue?: string;
  issueNarrative?: string;
  issue?: string;
  rootCause?: string;
  rootCauseType?: string;
  impact?: string;
  recommendation?: string;
  mitigatingControls?: string;
  auditableEntity?: string;
  
  // Business Management Response Loop
  accountableFunction?: string;
  accountableProcessArea?: string;
  function?: string;
  processArea?: string;
  repeatFinding?: string;
  issueCauseType?: string;
  soxReportable?: string;
  businessContactId?: string;
  businessContactName?: string;
  accountableContact?: string;
  managementResponse?: string;
  remediationTargetDate?: string;
  agreedRemediationDate?: string;
  managementActionPlan?: string;
  businessManagementReason?: string;
  businessManagementResponse?: string;
  businessManagementAttachment?: string;

  // Active AI Version Tracking
  activeAiVersionId?: string;
  activeAiVersionNumber?: number;

  // Concurrency & Lock Mechanism
  isLocked?: boolean;
  lockedBy?: IssueLock['lockedBy'];
  lockedAt?: string | null;

  // Exclusion & Callback Mechanism
  isExcluded?: boolean;
  excludedAt?: string | null;
  previousStatus?: string | null;
  callbackReason?: string | null;
  callbackTimestamp?: string | null;

  // Additional Finding Narrative & Governance Fields
  nonComplianceReferences?: string;
  summaryFinding?: string;
  auditorResponse?: string;
  mitigatingControl?: string;
  exceptionRemedComments?: string;
  exceptionRemedDate?: string;
  hasExceptionRemedDate?: boolean;
  issueType?: string;
  issueSource?: string;
  keyTheme?: string;
  itAssetAccountableSector?: string;
  impactedRegion?: string;
  impactedSector?: string;
  impactedMrc?: string;
  quarterImpacted?: string;
  primaryBusinessOwnerId?: string;
  primaryBusinessOwnerName?: string;
  secondaryBusinessOwnerIds?: string[];
  secondaryBusinessOwnerNames?: string;
  salesUsd?: number | string;
  ibtUsd?: number | string;
  netIncomeUsd?: number | string;
  totalAssetsUsd?: number | string;
  workflowRemarks?: string;
  currentLevel?: string;
  tech?: 'IT' | 'FinOps' | string;
  reportReference?: number;
  lockStatus?: boolean;
  primaryContact?: string;
  owner?: string;
  currentOwner?: string;
  createdBy?: string;
  lastEditedBy?: string;
  createdAt?: string;
  updatedAt?: string;

  unresolvedCommentsCount?: number;
}

export interface IssueAiVersion {
  versionId: string;
  issueId: string;
  versionNumber: number;
  status: 'ACTIVE' | 'PREVIOUS' | 'CANDIDATE' | 'DISCARDED';
  synthesizedHeader: string;
  synthesizedDescription: string;
  synthesizedRootCause: string;
  synthesizedImpact: string;
  synthesizedRecommendation: string;
  adoptedFieldsMap?: Record<string, number>;
  generatedByUserId: string;
  generatedAt: string;
}

export interface IssueComment {
  commentId: string;
  issueId: string;
  fieldKey: string;
  content: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  taggedUserId?: string | null;
  taggedUserName?: string | null;
  isResolved: boolean;
  resolvedById?: string | null;
  resolvedByName?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
}

export interface AuditTrailLog {
  logId: string;
  entityName: string;
  recordId: string;
  action: string;
  previousState: string | null;
  newState: string | null;
  performedByUserId: string;
  performedByUserName: string;
  userRole: string;
  remarks?: string;
  timestamp: string;
}
