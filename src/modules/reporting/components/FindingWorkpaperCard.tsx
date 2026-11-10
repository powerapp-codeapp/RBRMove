import React, { useState, useEffect, useMemo } from 'react';
import type { Issue, IssueStatus, IssueComment } from '../../../types/dataverse.types';
import { FieldCommentPopover, type CommentUser } from './FieldCommentPopover';
import { SharedTooltip } from '../../../components/shared';
import { MessageSquare, PanelLeftOpen } from 'lucide-react';
import { synthesizeAiDraft } from '../utils/aiSynthesisHelper';
import { getRoleDetails, isITIssue } from '../utils/reportingWorkflowEngine';
import { AiVersionCompareDialog, type AiCompareFieldData } from './AiVersionCompareDialog';
import { GuidelinesDrawer } from './GuidelinesDrawer';
import {
  BusinessOwnerCommentsDrawer,
  type BusinessOwnerCommentItem,
} from './BusinessOwnerCommentsDrawer';
import { WorkflowRemarksModal } from './WorkflowRemarksModal';
import type { AssignedTeamMember } from './SendToModal';
import { useTaxonomies } from '../../../services/taxonomyService';
import { SystemusersService } from '../../../generated/services/SystemusersService';
import { reformatFieldTextWithAi } from '../../../services/dataverseReportingService';

import {
  WorkpaperHeaderToolbar,
  type SectionTab,
} from './workpaper/WorkpaperHeaderToolbar';
import { WorkpaperBizFeedbackBanner } from './workpaper/WorkpaperBizFeedbackBanner';
import { WorkpaperPrimaryInputsTab } from './workpaper/WorkpaperPrimaryInputsTab';
import {
  WorkpaperAiFieldsTab,
  type FieldRemarksState,
} from './workpaper/WorkpaperAiFieldsTab';
import { WorkpaperTaxonomiesTab } from './workpaper/WorkpaperTaxonomiesTab';
import { WorkpaperBusinessResponseTab } from './workpaper/WorkpaperBusinessResponseTab';
import {
  WorkpaperRespondOnBehalfDialog,
  type BizOnBehalfDraft,
  type BizOnBehalfErrors,
} from './workpaper/WorkpaperRespondOnBehalfDialog';

interface FindingWorkpaperCardProps {
  issue: Issue;
  onUpdateIssue: (updated: Issue) => void;
  onOpenAiCompare?: () => void;
  onOpenLogs: () => void;
  onOpenWorkflow?: () => void;
  onOpenComments?: (fieldKey: string, fieldLabel: string) => void;
  commentCounts?: Record<string, number>;
  comments?: IssueComment[];
  onAddComment?: (fieldKey: string, fieldLabel: string, content: string, taggedUser?: CommentUser) => void;
  onResolveComment?: (commentId: string) => void;
  isAiSynthesizing?: boolean;
  onTriggerAiSynthesis?: () => void;
  canEdit: boolean;
  editRestrictionReason?: string | null;
  onExcludeIssue?: (issueId: string) => void;
  onIncludeIssue?: (issueId: string) => void;
  onToggleLock?: (issueId: string) => void;
  onAcquireLock?: (issueId: string) => void;
  onOpenCallback?: (issueId: string) => void;
  onOpenSendTo?: (issueId: string) => void;
  onMarkNotAnIssue?: (issueId: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: (collapsed: boolean) => void;
  currentUser?: { name?: string; role?: string; avatar?: string; userId?: string; email?: string; isAdmin?: boolean };
  assignedUsers?: AssignedTeamMember[];
  isAdmin?: boolean;
  onAdvanceWorkflow?: (targetStatus: IssueStatus, remarks?: string) => void;
  userRole?: string;
  hasCriticalFinding?: boolean;
  testProcedureOptions?: { value: string; label: string }[];
  onSaveBusinessResponseOnBehalf?: (
    issueId: string,
    payload: { reason: string; response: string; attachment?: string; targetDate?: string }
  ) => Promise<void>;
}

export const FindingWorkpaperCard: React.FC<FindingWorkpaperCardProps> = ({
  issue,
  onUpdateIssue,
  onOpenAiCompare: _onOpenAiCompare,
  onOpenLogs,
  onOpenWorkflow,
  comments = [],
  onAddComment,
  onResolveComment,
  canEdit,
  editRestrictionReason,
  onExcludeIssue,
  onIncludeIssue,
  onToggleLock,
  onAcquireLock,
  onOpenCallback,
  onOpenSendTo,
  onMarkNotAnIssue,
  isCollapsed = false,
  onToggleCollapse,
  currentUser,
  assignedUsers = [],
  isAdmin = false,
  onAdvanceWorkflow,
  userRole,
  testProcedureOptions = [],
  onSaveBusinessResponseOnBehalf,
}) => {
  const isExcluded = Boolean(issue.isExcluded || issue.status === 'Excluded');

  const { getOptions: getTaxonomyOpts } = useTaxonomies();
  const criticalityOptions = useMemo(() => getTaxonomyOpts('criticality'), [getTaxonomyOpts]);
  const issueTypeOptions = useMemo(() => getTaxonomyOpts('issue_type'), [getTaxonomyOpts]);
  const rootCauseTypeOptions = useMemo(() => getTaxonomyOpts('issue_cause_type'), [getTaxonomyOpts]);
  const issueSourceOptions = useMemo(() => getTaxonomyOpts('issue_source'), [getTaxonomyOpts]);
  const keyThemeOptions = useMemo(() => getTaxonomyOpts('key_theme'), [getTaxonomyOpts]);
  const processAreaOptions = useMemo(() => getTaxonomyOpts('process_area'), [getTaxonomyOpts]);
  const repeatFindingOptions = useMemo(() => getTaxonomyOpts('repeat_finding'), [getTaxonomyOpts]);
  const itAssetAccountableSectorOptions = useMemo(() => getTaxonomyOpts('it_asset_accountable_sector'), [getTaxonomyOpts]);
  const accountableFunctionOptions = useMemo(() => getTaxonomyOpts('accountable_function'), [getTaxonomyOpts]);
  const impactedRegionOptions = useMemo(() => getTaxonomyOpts('impacted_region'), [getTaxonomyOpts]);
  const impactedSectorOptions = useMemo(() => getTaxonomyOpts('impacted_sector'), [getTaxonomyOpts]);
  const impactedMrcOptions = useMemo(() => getTaxonomyOpts('impacted_mrc'), [getTaxonomyOpts]);
  const quarterImpactedOptions = useMemo(() => getTaxonomyOpts('quarter_impacted'), [getTaxonomyOpts]);

  const [activeSectionTab, setActiveSectionTab] = useState<SectionTab>('all');
  const [activeCommentField, setActiveCommentField] = useState<string | null>(null);

  const [remarksModalConfig, setRemarksModalConfig] = useState<{
    isOpen: boolean;
    title: string;
    actionLabel: string;
    targetStatus: IssueStatus;
  } | null>(null);

  const getStatusTier = (status?: string): number => {
    const s = (status || '').toLowerCase().trim();
    if (!s || s.includes('staff') || s.includes('draft') || s.includes('auditor')) return 1;
    if (s.includes('tc') || s.includes('coordinator')) return 2;
    if (s.includes('manager') || s.includes('mgr') || s.includes('waiting for other issues')) return 3;
    if (s.includes('ready for director') || s.includes('pending director')) return 4;
    if (s.includes('business')) return 4.5;
    if (s.includes('vp')) return 5;
    if (s.includes('completed') || s.includes('signed off')) return 6;
    return 1;
  };

  const getUserTier = (roleStr?: string): number => {
    const roleDetails = getRoleDetails(roleStr);
    const base = roleDetails.baseRole;
    if (base === 'admin') return 99;
    if (base === 'vp') return 5;
    if (base === 'director') return 4;
    if (base === 'manager') return 3;
    if (base === 'team-coordinator') return 2;
    return 1;
  };

  const issueTier = getStatusTier(issue.status);
  const userTier = getUserTier(userRole || currentUser?.role);
  const isUserAdmin = Boolean(currentUser?.isAdmin || isAdmin || userTier === 99);
  const isFurtherStage = !isUserAdmin && issueTier > userTier;

  const isLocked = Boolean(issue.isLocked);
  const currentUserId = (currentUser?.userId || '').trim().toLowerCase();
  const currentUserName = (currentUser?.name || '').trim().toLowerCase();
  const currentUserEmail = (currentUser?.email || '').trim().toLowerCase();
  const lockedById = (issue.lockedBy?.userId || (issue as any).lockedByUserId || '').trim().toLowerCase();
  const lockedByName = (issue.lockedBy?.name || (typeof (issue as any).lockedBy === 'string' ? (issue as any).lockedBy : '')).trim().toLowerCase();
  const lockedByEmail = (issue.lockedBy?.email || '').trim().toLowerCase();

  const isLockedByCurrentUser = Boolean(
    isLocked && (
      (currentUserId && lockedById && currentUserId === lockedById) ||
      (currentUserEmail && lockedByEmail && currentUserEmail === lockedByEmail) ||
      (currentUserName && lockedByName && currentUserName === lockedByName)
    )
  );

  const canCallBack = useMemo(() => {
    if (isExcluded) return false;
    if (!canEdit) return false;
    if (isLocked && !isLockedByCurrentUser) return false;
    const status = (issue.status || '').trim();
    if (status === 'Completed' || status === 'Signed Off' || status === 'Excluded') return false;

    if (userTier === 4) {
      const s = status.toLowerCase();
      return s.includes('business') || s === 'pending vp';
    }

    if (userTier < 4) {
      return issueTier > userTier;
    }

    if (userTier === 99) {
      return status !== 'Pending Staff' && status !== 'Draft';
    }

    return false;
  }, [isExcluded, canEdit, isLocked, isLockedByCurrentUser, issue.status, issueTier, userTier]);

  const canSendTo =
    canEdit &&
    !isExcluded &&
    issue.status !== 'Completed' &&
    issue.status !== 'Signed Off' &&
    (!isLocked || isLockedByCurrentUser) &&
    (!isFurtherStage || isUserAdmin);

  const isFieldDisabled = !canEdit || isExcluded || isFurtherStage || (isLocked && !isLockedByCurrentUser);

  const canExclude =
    canEdit &&
    !isFieldDisabled &&
    issue.status !== 'Completed' &&
    issue.status !== 'Signed Off';

  const canShowIssueButtons = !isExcluded;

  const [systemUsers, setSystemUsers] = useState<{ value: string; label: string }[]>([]);

  useEffect(() => {
    let isSubscribed = true;
    SystemusersService.getAll()
      .then((res: any) => {
        if (!isSubscribed) return;
        const users = Array.isArray(res?.data) ? res.data : Array.isArray(res?.value) ? res.value : Array.isArray(res) ? res : [];
        if (users.length > 0) {
          const mapped = users
            .filter((u: any) => u.fullname || u.internalemailaddress)
            .map((u: any) => ({
              value: u.systemuserid || u.id || u.internalemailaddress,
              label: `${u.fullname || u.internalemailaddress}${u.internalemailaddress ? ` (${u.internalemailaddress})` : ''}`,
            }));
          setSystemUsers(mapped);
        } else {
          const fallbackList = (assignedUsers || []).map((u, i) => ({
            value: u.userId || u.id || `user-fallback-${i}`,
            label: `${u.displayName || u.name} (${u.roleName || u.roleAbbr || 'Team'})`,
          }));
          if (currentUser?.name) {
            fallbackList.unshift({
              value: currentUser.userId || 'current-user',
              label: `${currentUser.name} (${currentUser.role || 'Auditor'})`,
            });
          }
          setSystemUsers(
            fallbackList.length > 0
              ? fallbackList
              : [{ value: currentUser?.userId || 'usr-1', label: currentUser?.name || 'Assigned Auditor' }]
          );
        }
      })
      .catch(() => {
        if (isSubscribed) {
          const fallbackList = (assignedUsers || []).map((u, i) => ({
            value: u.userId || u.id || `user-fallback-${i}`,
            label: `${u.displayName || u.name} (${u.roleName || u.roleAbbr || 'Team'})`,
          }));
          if (currentUser?.name) {
            fallbackList.unshift({
              value: currentUser.userId || 'current-user',
              label: `${currentUser.name} (${currentUser.role || 'Auditor'})`,
            });
          }
          setSystemUsers(
            fallbackList.length > 0
              ? fallbackList
              : [{ value: currentUser?.userId || 'usr-1', label: currentUser?.name || 'Assigned Auditor' }]
          );
        }
      });

    return () => {
      isSubscribed = false;
    };
  }, [assignedUsers, currentUser]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (document.querySelector('[data-field-comment-drawer="true"]')) {
        return;
      }
      const target = e.target as HTMLElement;
      if (!target.closest('.field-comment-container')) {
        setActiveCommentField(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const availableUsers: CommentUser[] = useMemo(() => {
    if (Array.isArray(assignedUsers) && assignedUsers.length > 0) {
      const colors = ['#000099', '#eb1700', '#059669', '#D97706', '#7C3AED', '#0D9488'];
      const seen = new Set<string>();
      const engagementMembers: CommentUser[] = [];

      assignedUsers.forEach((u, idx) => {
        const cleanName = (u.displayName || u.name || '').trim();
        if (!cleanName) return;
        const uniqueKey = (u.email || u.userId || u.id || cleanName).toLowerCase().trim();
        if (seen.has(uniqueKey)) return;
        seen.add(uniqueKey);

        const initials =
          u.initials ||
          cleanName
            .split(' ')
            .map((p) => p[0])
            .filter(Boolean)
            .join('')
            .slice(0, 2)
            .toUpperCase() ||
          'U';

        engagementMembers.push({
          userId: u.userId || u.id || u.email || `ENG-USR-${idx + 1}`,
          name: cleanName,
          role: u.roleName || u.roleAbbr || u.roleId || 'Auditor',
          avatar: initials,
          avatarBg: colors[engagementMembers.length % colors.length],
        });
      });

      if (engagementMembers.length > 0) {
        return engagementMembers;
      }
    }

    return [
      {
        userId: currentUser?.userId || 'USR-CURRENT',
        name: currentUser?.name || 'Assigned Auditor',
        role: userRole || 'Auditor',
        avatar: (currentUser?.name || 'AU').slice(0, 2).toUpperCase(),
        avatarBg: '#000099',
      },
    ];
  }, [assignedUsers, currentUser, userRole]);

  const currentCommentUser: CommentUser = useMemo(() => {
    const cId = (currentUser?.userId || '').trim().toLowerCase();
    const cName = (currentUser?.name || '').trim().toLowerCase();
    const cEmail = (currentUser?.email || '').trim().toLowerCase();
    const matchedMember = Array.isArray(assignedUsers)
      ? assignedUsers.find((u) => {
        const uId = (u.userId || u.id || '').trim().toLowerCase();
        const uEmail = (u.email || '').trim().toLowerCase();
        const uName = (u.displayName || u.name || '').trim().toLowerCase();
        return (
          (cEmail && uEmail && cEmail === uEmail) ||
          (cId && uId && cId === uId) ||
          (cName && uName && (cName === uName || uName.includes(cName) || cName.includes(uName)))
        );
      })
      : undefined;

    return {
      userId: currentUser?.userId || matchedMember?.userId || matchedMember?.id || 'USR-001',
      name: currentUser?.name || matchedMember?.displayName || matchedMember?.name || 'Current Auditor',
      role: userRole || matchedMember?.roleName || matchedMember?.roleAbbr || 'Auditor',
      avatar: (currentUser?.name || 'CA')
        .split(' ')
        .map((n) => n[0])
        .filter(Boolean)
        .join('')
        .slice(0, 2)
        .toUpperCase() || 'CA',
      avatarBg: '#000099',
    };
  }, [assignedUsers, currentUser, userRole]);

  // Determine if function is IT or FinOps via engine helper (no TP hardcoding)
  const isIT = isITIssue(issue);

  const [lastGeneratedParams, setLastGeneratedParams] = useState<{
    originalIssue: string;
    function: 'IT' | 'FinOps';
    testProcedureCode: string;
  } | null>(null);

  const [isBannerDismissed, setIsBannerDismissed] = useState(false);
  const [isAiLoadingLocal, setIsAiLoadingLocal] = useState(false);
  const [isCompareOpen, setIsCompareOpen] = useState(false);
  const [isGuidelinesDrawerOpen, setIsGuidelinesDrawerOpen] = useState(false);
  const [isBizCommentsDrawerOpen, setIsBizCommentsDrawerOpen] = useState(false);
  const [bizCommentsByIssue, setBizCommentsByIssue] = useState<Record<string, BusinessOwnerCommentItem[]>>({});

  const currentBizComments: BusinessOwnerCommentItem[] = useMemo(() => {
    const issueKey = issue.id || 'default-issue';
    if (bizCommentsByIssue[issueKey]) {
      return bizCommentsByIssue[issueKey];
    }
    const primaryOwnerName =
      issue.primaryBusinessOwnerName ||
      issue.accountableContact ||
      issue.businessContactName ||
      'Thomas Wright';
    const primaryInitials =
      primaryOwnerName
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase() || '')
        .join('') || 'TW';

    return [
      {
        id: `${issueKey}-biz-1`,
        authorName: primaryOwnerName,
        authorInitials: primaryInitials,
        authorRole: 'Accountable Contact',
        authorTitle: 'VP, Global Operations & Process Governance',
        commentText:
          'We have reviewed the observation and agree with the overall control gap identified. However, please note in the Impact section that compensating manual monthly reconciliations were performed for Q3, so no financial misstatement occurred.',
        commentedAt: 'Oct 27, 2026 • 11:45 AM',
        isDone: false,
      },
      {
        id: `${issueKey}-biz-2`,
        authorName: 'Elena Rostova',
        authorInitials: 'ER',
        authorRole: 'Supporting Business Contact',
        authorTitle: 'Director, Quality Assurance & Compliance',
        commentText:
          'For Recommendation #2 regarding automated role recertification, our IT release calendar schedules the ERP patch deployment for Q1 2027. Requesting the target remediation date be aligned to March 31, 2027.',
        commentedAt: 'Oct 26, 2026 • 04:20 PM',
        isDone: false,
      },
      {
        id: `${issueKey}-biz-3`,
        authorName: primaryOwnerName,
        authorInitials: primaryInitials,
        authorRole: 'Accountable Contact',
        authorTitle: 'VP, Global Operations & Process Governance',
        commentText:
          'Confirmed that the SOP reference number in the finding description should cite SOP-QA-408 Rev 4 rather than Rev 3.',
        commentedAt: 'Oct 25, 2026 • 02:15 PM',
        isDone: true,
        doneBy: currentUser?.name || 'Audit Manager',
        doneAt: 'Oct 26, 2026 • 09:30 AM',
      },
    ];
  }, [
    bizCommentsByIssue,
    issue.id,
    issue.primaryBusinessOwnerName,
    issue.accountableContact,
    issue.businessContactName,
    currentUser?.name,
  ]);

  const openBizCommentsCount = useMemo(
    () => currentBizComments.filter((c) => !c.isDone).length,
    [currentBizComments]
  );

  const handleToggleBizCommentDone = (commentId: string) => {
    const issueKey = issue.id || 'default-issue';
    const updated = currentBizComments.map((c) => {
      if (c.id !== commentId) return c;
      const nextDone = !c.isDone;
      return {
        ...c,
        isDone: nextDone,
        doneBy: nextDone ? currentUser?.name || 'Reviewer' : undefined,
        doneAt: nextDone ? 'Just now' : undefined,
      };
    });
    setBizCommentsByIssue((prev) => ({
      ...prev,
      [issueKey]: updated,
    }));
  };

  const handleMarkAllBizCommentsDone = () => {
    const issueKey = issue.id || 'default-issue';
    const updated = currentBizComments.map((c) =>
      c.isDone
        ? c
        : {
          ...c,
          isDone: true,
          doneBy: currentUser?.name || 'Reviewer',
          doneAt: 'Just now',
        }
    );
    setBizCommentsByIssue((prev) => ({
      ...prev,
      [issueKey]: updated,
    }));
  };

  const [previousAiData, setPreviousAiData] = useState<AiCompareFieldData | null>(null);
  const [candidateAiData, setCandidateAiData] = useState<AiCompareFieldData | null>(null);
  const [fieldRemarks, setFieldRemarks] = useState<FieldRemarksState>({
    title: '',
    issueNarrative: '',
    rootCause: '',
    impact: '',
    recommendation: '',
  });

  const [isEditingBizOnBehalf, setIsEditingBizOnBehalf] = useState(false);
  const [bizOnBehalfDraft, setBizOnBehalfDraft] = useState<BizOnBehalfDraft>({
    reason: '',
    response: '',
    attachment: '',
  });
  const [bizOnBehalfErrors, setBizOnBehalfErrors] = useState<BizOnBehalfErrors>({});

  const canAddBizOnBehalf =
    canEdit &&
    !isExcluded &&
    issue.status !== 'Completed' &&
    issue.status !== 'Signed Off' &&
    (!isLocked || isLockedByCurrentUser);

  const isBizResponseEmpty = !(issue.businessManagementResponse || issue.managementResponse || '').trim();

  const handleToggleBizOnBehalf = (checked: boolean) => {
    if (checked) {
      setBizOnBehalfDraft({
        reason: issue.businessManagementReason || '',
        response: issue.businessManagementResponse || issue.managementResponse || '',
        attachment: issue.businessManagementAttachment || '',
        targetDate: issue.agreedRemediationDate || issue.remediationTargetDate || '',
      });
      setBizOnBehalfErrors({});
      setIsEditingBizOnBehalf(true);
    } else {
      setIsEditingBizOnBehalf(false);
      setBizOnBehalfErrors({});
    }
  };

  const handleSaveBizOnBehalf = async () => {
    const errors: BizOnBehalfErrors = {};

    if (!bizOnBehalfDraft.response.trim()) {
      errors.response = 'Please enter the Business Management Response.';
    }
    if (!bizOnBehalfDraft.reason.trim()) {
      errors.reason = 'Please provide the reason for adding this response on behalf of the Business Manager.';
    }

    if (Object.keys(errors).length > 0) {
      setBizOnBehalfErrors(errors);
      return;
    }

    if (onSaveBusinessResponseOnBehalf) {
      await onSaveBusinessResponseOnBehalf(issue.id, {
        reason: bizOnBehalfDraft.reason.trim(),
        response: bizOnBehalfDraft.response.trim(),
        attachment: bizOnBehalfDraft.attachment.trim(),
        targetDate: bizOnBehalfDraft.targetDate?.trim(),
      });
    } else {
      const nowFormatted = new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      onUpdateIssue({
        ...issue,
        businessManagementReason: bizOnBehalfDraft.reason.trim(),
        businessManagementResponse: bizOnBehalfDraft.response.trim(),
        managementResponse: bizOnBehalfDraft.response.trim(),
        businessManagementAttachment: bizOnBehalfDraft.attachment.trim(),
        businessResponseStatus: 'Completed',
        businessResponseBy: 'Audit Team',
        businessResponseProvidedBy: currentCommentUser.name || currentUser?.name || 'Auditor',
        businessResponseProvidedAt: new Date().toISOString(),
        businessResponseAddedOnBehalfBy: currentCommentUser.name || currentUser?.name || 'Auditor',
        businessResponseAddedOnBehalfRole: currentCommentUser.role || currentUser?.role || userRole || 'Auditor',
        businessResponseAddedOnBehalfAt: nowFormatted,
        agreedRemediationDate: bizOnBehalfDraft.targetDate?.trim() || issue.agreedRemediationDate,
        remediationTargetDate: bizOnBehalfDraft.targetDate?.trim() || issue.remediationTargetDate,
      });
    }

    setBizOnBehalfErrors({});
    setIsEditingBizOnBehalf(false);
  };

  useEffect(() => {
    setIsBannerDismissed(false);
    setIsCompareOpen(false);
    setIsEditingBizOnBehalf(false);
    setBizOnBehalfErrors({});
    setLastGeneratedParams({
      originalIssue: (issue.originalIssue || issue.description || issue.title || '').trim(),
      function: isIT ? 'IT' : 'FinOps',
      testProcedureCode: issue.testProcedureCode || '',
    });
    setFieldRemarks({
      title: '',
      issueNarrative: '',
      rootCause: '',
      impact: '',
      recommendation: '',
    });
  }, [issue.id]);

  const currentOriginalIssue = (issue.originalIssue || issue.description || issue.title || '').trim();
  const currentFunction: 'IT' | 'FinOps' = isIT ? 'IT' : 'FinOps';
  const currentTestProc = issue.testProcedureCode || '';

  const hasParamsChanged = Boolean(
    lastGeneratedParams && (
      lastGeneratedParams.originalIssue !== currentOriginalIssue ||
      lastGeneratedParams.function !== currentFunction ||
      lastGeneratedParams.testProcedureCode !== currentTestProc
    )
  );

  const isRegenerateActive = !isExcluded && canEdit && !isFurtherStage && hasParamsChanged && !isBannerDismissed;

  const handleFieldRemarkChange = (field: keyof FieldRemarksState, remark: string) => {
    setFieldRemarks((prev) => ({
      ...prev,
      [field]: remark,
    }));
  };

  const handleRegenerateAi = async () => {
    if (isFieldDisabled) return;
    setIsAiLoadingLocal(true);

    const prev: AiCompareFieldData = {
      title: issue.title || '',
      description: issue.issueNarrative || issue.description || issue.issue || '',
      rootCause: issue.rootCause || '',
      impact: issue.impact || '',
      recommendation: issue.recommendation || '',
      nonComplianceReferences: issue.nonComplianceReferences || '',
    };
    setPreviousAiData(prev);

    await new Promise((res) => setTimeout(res, 800));

    const nextVer = (issue.activeAiVersionNumber || 1) + 1;
    const synthesized = synthesizeAiDraft(
      issue.testProcedureCode || '',
      currentOriginalIssue,
      currentFunction,
      {
        updatedIssueHeader: fieldRemarks.title,
        description: fieldRemarks.issueNarrative,
        rootCause: fieldRemarks.rootCause,
        impact: fieldRemarks.impact,
        recommendation: fieldRemarks.recommendation,
      },
      nextVer
    );

    const candidate: AiCompareFieldData = {
      title: synthesized.updatedIssueHeader,
      description: synthesized.description,
      rootCause: synthesized.rootCause,
      impact: synthesized.impact,
      recommendation: synthesized.recommendation,
      nonComplianceReferences: synthesized.nonComplianceReferences || issue.nonComplianceReferences || '',
    };
    setCandidateAiData(candidate);

    setIsAiLoadingLocal(false);
    setIsCompareOpen(true);
  };

  const handleApplyAiMerge = (merged: AiCompareFieldData) => {
    onUpdateIssue({
      ...issue,
      title: merged.title,
      issueNarrative: merged.description,
      description: merged.description,
      rootCause: merged.rootCause,
      impact: merged.impact,
      recommendation: merged.recommendation,
      nonComplianceReferences: merged.nonComplianceReferences ?? issue.nonComplianceReferences,
      activeAiVersionNumber: (issue.activeAiVersionNumber || 1) + 1,
    });
    setLastGeneratedParams({
      originalIssue: currentOriginalIssue,
      function: currentFunction,
      testProcedureCode: currentTestProc,
    });
    setIsBannerDismissed(false);
    setIsCompareOpen(false);
  };

  const handleFieldChange = (field: keyof Issue, value: any) => {
    if (isFieldDisabled) return;
    onUpdateIssue({
      ...issue,
      [field]: value,
    });
  };

  // Field-level AI text formatting calling the Power Automate flow
  const handleAiRewriteField = async (
    fieldKey: string,
    action: 'rewrite' | 'tone' | 'detailed' | 'shorter',
    inputText?: string
  ): Promise<string> => {
    return reformatFieldTextWithAi({
      auditableEntity: (issue as any).auditableEntity,
      engagementId: issue.engagementId || issue.jobId,
      jobId: issue.jobId,
      issueId: issue.id,
      inputField: fieldKey,
      inputText: inputText || '',
      action,
      issueHeader: issue.title,
      issue: issue.issueNarrative || issue.description,
      rootCause: issue.rootCause,
      impact: issue.impact,
      recommendations: issue.recommendation,
      technologyRelated: isIT,
    });
  };

  const renderCommentTrigger = (fieldKey: string, fieldLabel: string, isRowLevel = false) => {
    const commentsList = comments.filter((c) => c.fieldKey === fieldKey);
    const count = commentsList.length;
    const isOpen = activeCommentField === fieldKey;
    const popoverPlacement: 'up' | 'down' = 'down';

    return (
      <div className="field-comment-container" style={{ position: 'relative', display: 'inline-block' }}>
        {count > 0 ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setActiveCommentField(isOpen ? null : fieldKey);
            }}
            title={`${count} comment${count > 1 ? 's' : ''} on ${fieldLabel}`}
            style={{
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              padding: isRowLevel ? '2px 6px' : '2px 8px',
              borderRadius: '12px',
              backgroundColor: isOpen ? '#DBEAFE' : '#EFF6FF',
              color: '#000099',
              fontSize: 'var(--type-caption-size, 10.5px)',
              fontWeight: 700,
              transition: 'background-color 0.15s ease',
            }}
          >
            <MessageSquare style={{ width: '10px', height: '10px', color: '#000099', fill: '#000099' }} />
            <span>{count}</span>
          </button>
        ) : (
          <SharedTooltip title={`Add comment on ${fieldLabel}`} placement="top">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                setActiveCommentField(isOpen ? null : fieldKey);
              }}
              style={{
                padding: isRowLevel ? '2px 5px' : '1px 6px',
                fontSize: 'var(--type-caption-size, 9.5px)',
                fontWeight: 600,
                borderRadius: '10px',
                border: isOpen ? '1px solid #000099' : '1px dashed #CBD5E1',
                backgroundColor: isOpen ? '#EFF6FF' : '#F8FAFC',
                color: isOpen ? '#000099' : '#64748B',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '3px',
                transition: 'all 0.15s ease',
              }}
            >
              <MessageSquare style={{ width: '9px', height: '9px', color: isOpen ? '#000099' : '#94A3B8' }} />
              <span>{isRowLevel ? '' : 'Comment'}</span>
            </button>
          </SharedTooltip>
        )}

        <FieldCommentPopover
          isOpen={isOpen}
          onClose={() => setActiveCommentField(null)}
          engagementId={issue.engagementId || issue.id}
          fieldKey={fieldKey}
          fieldLabel={fieldLabel}
          comments={commentsList}
          currentUser={currentCommentUser}
          availableUsers={availableUsers}
          placement={popoverPlacement}
          onAddComment={(text, taggedUser) => {
            onAddComment?.(fieldKey, fieldLabel, text, taggedUser);
          }}
          onResolveComment={(commentId) => {
            onResolveComment?.(commentId);
          }}
        />
      </div>
    );
  };

  // If collapsed, render 36px vertical rail
  if (isCollapsed) {
    return (
      <div
        style={{
          width: '36px',
          minWidth: '36px',
          backgroundColor: '#ffffff',
          borderRight: '1px solid #CBD5E1',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: '10px',
          gap: '16px',
          userSelect: 'none',
          flexShrink: 0,
          height: '100%',
        }}
      >
        <button
          onClick={() => onToggleCollapse?.(false)}
          title="Expand Form Editor"
          style={{
            background: 'none',
            border: 'none',
            padding: '4px',
            color: '#64748B',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'color 0.15s ease',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#000099')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
        >
          <PanelLeftOpen style={{ width: '16px', height: '16px' }} />
        </button>
        <div
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            fontSize: '10.5px',
            fontWeight: 800,
            color: '#475569',
            letterSpacing: '1px',
            whiteSpace: 'nowrap',
          }}
        >
          FORM EDITOR
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        maxHeight: '100%',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
      }}
    >
      {/* Pane 2 Top Header Toolbar Section */}
      <WorkpaperHeaderToolbar
        issue={issue}
        isExcluded={isExcluded}
        isLocked={isLocked}
        isLockedByCurrentUser={isLockedByCurrentUser}
        canEdit={canEdit}
        editRestrictionReason={editRestrictionReason}
        isFurtherStage={isFurtherStage}
        userTier={userTier}
        userRole={userRole}
        canCallBack={canCallBack}
        canSendTo={canSendTo}
        canExclude={canExclude}
        isFieldDisabled={isFieldDisabled}
        canShowIssueButtons={canShowIssueButtons}
        activeSectionTab={activeSectionTab}
        onTabChange={(tab) => setActiveSectionTab(tab)}
        onToggleCollapse={onToggleCollapse}
        onToggleLock={onToggleLock}
        onIncludeIssue={onIncludeIssue}
        onAdvanceWorkflow={onAdvanceWorkflow}
        onOpenRemarksModal={(cfg) => setRemarksModalConfig(cfg)}
        onOpenCallback={onOpenCallback}
        onOpenSendTo={onOpenSendTo}
        onMarkNotAnIssue={onMarkNotAnIssue}
        onExcludeIssue={onExcludeIssue}
        onOpenLogs={onOpenLogs}
        onOpenWorkflow={onOpenWorkflow}
      />

      {/* Pane 2 Main Body */}
      <div
        className="no-scrollbar"
        onFocusCapture={() => {
          if (!isLocked && canEdit && !isExcluded && onAcquireLock) {
            onAcquireLock(issue.id);
          }
        }}
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: '24px clamp(16px, 1.6vw, 24px) 24px clamp(16px, 1.6vw, 24px)',
          display: 'flex',
          flexDirection: 'column',
          gap: 'clamp(16px, 1.8vh, 22px)',
          backgroundColor: '#ffffff',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
        }}
      >
        {/* Row 4: Business Owner Feedback Banner (when comments exist) */}
        <WorkpaperBizFeedbackBanner
          totalCount={currentBizComments.length}
          openCount={openBizCommentsCount}
          onOpenDrawer={() => setIsBizCommentsDrawerOpen(true)}
        />

        {/* 1. PRIMARY INPUTS SECTION */}
        {(activeSectionTab === 'all' || activeSectionTab === 'basic') && (
          <WorkpaperPrimaryInputsTab
            issue={issue}
            isFieldDisabled={isFieldDisabled}
            testProcedureOptions={testProcedureOptions}
            onFieldChange={handleFieldChange}
            renderCommentTrigger={renderCommentTrigger}
          />
        )}

        {/* 2. AI GENERATED FIELDS SECTION */}
        {(activeSectionTab === 'all' || activeSectionTab === 'ai') && (
          <WorkpaperAiFieldsTab
            issue={issue}
            isFieldDisabled={isFieldDisabled}
            isRegenerateActive={isRegenerateActive}
            isAiLoadingLocal={isAiLoadingLocal}
            fieldRemarks={fieldRemarks}
            onFieldChange={handleFieldChange}
            onFieldRemarkChange={handleFieldRemarkChange}
            onRegenerateAi={handleRegenerateAi}
            onDismissRegenerateBanner={() => setIsBannerDismissed(true)}
            onOpenGuidelinesDrawer={() => setIsGuidelinesDrawerOpen(true)}
            onAiRewriteField={handleAiRewriteField}
            renderCommentTrigger={renderCommentTrigger}
          />
        )}

        {/* 3. TAXONOMY & EXTENDED GOVERNANCE FIELDS */}
        {(activeSectionTab === 'all' || activeSectionTab === 'taxonomies') && (
          <WorkpaperTaxonomiesTab
            issue={issue}
            isFieldDisabled={isFieldDisabled}
            criticalityOptions={criticalityOptions}
            issueTypeOptions={issueTypeOptions}
            rootCauseTypeOptions={rootCauseTypeOptions}
            issueSourceOptions={issueSourceOptions}
            keyThemeOptions={keyThemeOptions}
            processAreaOptions={processAreaOptions}
            repeatFindingOptions={repeatFindingOptions}
            itAssetAccountableSectorOptions={itAssetAccountableSectorOptions}
            accountableFunctionOptions={accountableFunctionOptions}
            impactedRegionOptions={impactedRegionOptions}
            impactedSectorOptions={impactedSectorOptions}
            impactedMrcOptions={impactedMrcOptions}
            quarterImpactedOptions={quarterImpactedOptions}
            systemUsers={systemUsers}
            onFieldChange={handleFieldChange}
            renderCommentTrigger={renderCommentTrigger}
          />
        )}

        {/* 4. BUSINESS MANAGEMENT RESPONSE */}
        {(activeSectionTab === 'all' || activeSectionTab === 'biz') && (
          <WorkpaperBusinessResponseTab
            issue={issue}
            isBizResponseEmpty={isBizResponseEmpty}
            isEditingBizOnBehalf={isEditingBizOnBehalf}
            canAddBizOnBehalf={canAddBizOnBehalf}
            onToggleBizOnBehalf={handleToggleBizOnBehalf}
            currentCommentUserName={currentCommentUser.name}
            currentCommentUserRole={currentCommentUser.role}
            userRole={userRole}
            renderCommentTrigger={renderCommentTrigger}
          />
        )}
      </div>

      {/* Respond on Behalf of Business Modal */}
      <WorkpaperRespondOnBehalfDialog
        isOpen={isEditingBizOnBehalf}
        onClose={() => handleToggleBizOnBehalf(false)}
        findingTitle={issue.title || issue.testProcedureCode || issue.id || 'Finding'}
        draft={bizOnBehalfDraft}
        errors={bizOnBehalfErrors}
        onChangeDraft={setBizOnBehalfDraft}
        onClearError={(field) => setBizOnBehalfErrors((prev) => ({ ...prev, [field]: undefined }))}
        onSave={handleSaveBizOnBehalf}
      />

      {/* AI Version Compare Modal */}
      <AiVersionCompareDialog
        open={isCompareOpen}
        onClose={() => setIsCompareOpen(false)}
        previousData={previousAiData || undefined}
        candidateData={candidateAiData || undefined}
        currentIssue={issue}
        onApplyMerge={handleApplyAiMerge}
      />

      {/* Workflow Transition with Remarks Modal */}
      <WorkflowRemarksModal
        isOpen={Boolean(remarksModalConfig?.isOpen)}
        onClose={() => setRemarksModalConfig(null)}
        title={remarksModalConfig?.title || 'Workflow Transition'}
        actionLabel={remarksModalConfig?.actionLabel || 'Submit'}
        itemTitle={issue.title || issue.id}
        currentStatusText={issue.status}
        targetStatusText={remarksModalConfig?.targetStatus}
        onConfirm={async (remarks) => {
          if (!remarksModalConfig) return;
          if (onAdvanceWorkflow) {
            onAdvanceWorkflow(remarksModalConfig.targetStatus, remarks);
          }
        }}
      />

      {/* AI POV / Quality Guidelines Drawer */}
      <GuidelinesDrawer
        open={isGuidelinesDrawerOpen}
        onClose={() => setIsGuidelinesDrawerOpen(false)}
      />

      {/* Business Owner Comments Drawer */}
      <BusinessOwnerCommentsDrawer
        open={isBizCommentsDrawerOpen}
        onClose={() => setIsBizCommentsDrawerOpen(false)}
        issueTitle={issue.title}
        comments={currentBizComments}
        onToggleDone={handleToggleBizCommentDone}
        onMarkAllDone={handleMarkAllBizCommentsDone}
      />
    </div>
  );
};