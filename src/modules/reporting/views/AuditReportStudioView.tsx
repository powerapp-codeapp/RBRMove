import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useEngagement } from '../../../context/EngagementContext';
import { useUserSession } from '../../../context/UserSessionContext';
import { getUserRoleOnEngagement, isUserAssignedToEngagement, getRoleDetails } from '../utils/reportingWorkflowEngine';
import { dataverseService } from '../../../services/dataverseService';
import {
  createDataverseIssue,
  fetchIssuesForEngagement,
  acquireIssueLock,
  releaseIssueLock,
  updateIssueCriticalityInDataverse,
  updateDataverseIssueFields,
  extractCleanGuid,
} from '../../../services/dataverseReportingService';
import type { Issue, IssueComment, AuditTrailLog, IssueStatus } from '../../../types/dataverse.types';
import type { CommentUser } from '../components/FieldCommentPopover';
import { FindingNavigator } from '../components/FindingNavigator';
import { FindingWorkpaperCard } from '../components/FindingWorkpaperCard';
import { AuditReportPreviewPane } from '../components/AuditReportPreviewPane';
import { useInactivityLockWatchdog } from '../hooks/useInactivityLockWatchdog';
import { SharedToast } from '../../../components/shared';
import { AuditReportHeaderToolbar } from '../components/AuditReportHeaderToolbar';
import { StudioPaneSplitter } from '../components/StudioPaneSplitter';
import { StudioDialogContainer } from '../components/StudioDialogContainer';

export const AuditReportStudioView: React.FC = () => {
  const { selectedEngagementId, setActiveReportingView, activeEngagement, setActiveEngagement } = useEngagement();
  const { currentUser, isAdmin, isImpersonating } = useUserSession();
  const effectiveIsAdmin = !isImpersonating && Boolean(currentUser?.isAdmin || isAdmin);

  // Check if current user is staffed on this specific active engagement
  const isAssignedToThisEngagement = useMemo(() => {
    if (!activeEngagement) return true;
    return isUserAssignedToEngagement(activeEngagement, currentUser.email, currentUser.userId);
  }, [activeEngagement, currentUser.email, currentUser.userId]);

  // Enforce Option A: An Admin who is NOT staffed on this engagement operates strictly in Read-Only Oversight Mode
  const isUnassignedAdmin = effectiveIsAdmin && !isAssignedToThisEngagement;

  // Dynamically resolve user's role on this active engagement (FRD Section 2.3)
  const currentRole = useMemo(() => {
    // 1. Resolve assigned role on active engagement for current / impersonated user
    if (activeEngagement) {
      const assignedRole = getUserRoleOnEngagement(activeEngagement, currentUser.email, currentUser.userId);
      if (assignedRole) return assignedRole;
    }
    // 2. Fallback to user's primary role if not generic admin label
    if (currentUser?.role && currentUser.role !== 'Global Audit Administrator') {
      return currentUser.role;
    }
    return 'it-manager';
  }, [activeEngagement, currentUser.email, currentUser.userId, currentUser.role]);

  // Dynamic test procedures from active engagement
  const testProcedureOptions = useMemo(() => {
    const procs = (activeEngagement as any)?.testProcedures;
    if (Array.isArray(procs) && procs.length > 0) {
      return procs.map((tp: any) => ({
        value: tp.iar_procedurecode || tp.code || tp.name || tp.id,
        label: `${tp.iar_procedurecode || tp.code || ''}: ${tp.iar_procedurename || tp.title || tp.name || ''}`,
      }));
    }
    return [];
  }, [activeEngagement]);

  const [issues, setIssues] = useState<Issue[]>([]);
  const [selectedIssueId, setSelectedIssueId] = useState<string | null>(null);
  const [comments, setComments] = useState<IssueComment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditTrailLog[]>([]);

  // 3-Pane Widths & Collapse States
  // Pane 1 is fixed at 24% (collapsible to 36px) with no resizing.
  // Pane 2 defaults to 40% (resizing min: 20%, max: 60%).
  // Pane 3 defaults to 36% (consuming remaining space with min: 20%, max: 50%).
  const pane1WidthPct = 24;
  const [pane2Width, setPane2Width] = useState(40); // percentage (20% to 60%)

  const [isPane1Collapsed, setIsPane1Collapsed] = useState(false);
  const [isPane2Collapsed, setIsPane2Collapsed] = useState(false);
  const [isPane3Collapsed, setIsPane3Collapsed] = useState(false);

  const [isDraggingSplitter2, setIsDraggingSplitter2] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Dialog & Modal States
  const [isAiCompareOpen, setIsAiCompareOpen] = useState(false);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isLogsOpen, setIsLogsOpen] = useState(false);
  const [logsScope, setLogsScope] = useState<'issue' | 'report'>('issue');
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [workflowScope, setWorkflowScope] = useState<'issue' | 'report'>('report');
  const [isCallbackModalOpen, setIsCallbackModalOpen] = useState(false);
  const [callbackIssueId, setCallbackIssueId] = useState<string | null>(null);
  const [isSendToModalOpen, setIsSendToModalOpen] = useState(false);
  const [sendToIssueId, setSendToIssueId] = useState<string | null>(null);
  const [isExcludeModalOpen, setIsExcludeModalOpen] = useState(false);
  const [issueToExclude, setIssueToExclude] = useState<Issue | null>(null);

  // Async States
  const [isAiSynthesizing, setIsAiSynthesizing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
    title?: string;
  } | null>(null);

  // Splitter 2 drag event listeners (resizing between Pane 2 and Pane 3)
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current || !isDraggingSplitter2) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const containerWidth = containerRect.width;

      const mouseX = e.clientX - containerRect.left;
      const pane1Px = isPane1Collapsed ? 36 : containerWidth * (pane1WidthPct / 100);
      const availablePx = mouseX - pane1Px;
      const pane2Pct = (availablePx / containerWidth) * 100;

      // Available percentage space for Pane 2 + Pane 3
      const remainingPct = 100 - (isPane1Collapsed ? (36 / containerWidth) * 100 : pane1WidthPct);
      // Constraints:
      // Pane 2: min 20%, max 60%
      // Pane 3: min 20%, max 50% => Pane 2 cannot exceed remainingPct - 20, nor fall below remainingPct - 50
      const minPane2 = Math.max(20, remainingPct - 50);
      const maxPane2 = Math.min(60, remainingPct - 20);
      const newPct = Math.min(Math.max(pane2Pct, minPane2), maxPane2);
      setPane2Width(Math.round(newPct));
    };

    const handleMouseUp = () => {
      setIsDraggingSplitter2(false);
    };

    if (isDraggingSplitter2) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSplitter2, isPane1Collapsed]);

  // Helper to sort issues by Ref # ascending with active issues first and excluded issues at the bottom
  const sortAndSequenceIssues = useCallback((rawList: Issue[]): Issue[] => {
    const sorted = [...rawList].sort((a, b) => {
      const aEx = a.isExcluded || a.status === 'Excluded' ? 1 : 0;
      const bEx = b.isExcluded || b.status === 'Excluded' ? 1 : 0;
      if (aEx !== bEx) return aEx - bEx;
      const aRef = Number(a.reportRef || (a as any).reportReference || 9999);
      const bRef = Number(b.reportRef || (b as any).reportReference || 9999);
      if (aRef !== bRef) return aRef - bRef;
      return new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime();
    });
    return sorted.map((item, idx) => ({
      ...item,
      reportRef: idx + 1,
      reportReference: idx + 1,
    }));
  }, []);

  // Load issues seamlessly from active engagement or Dataverse (and refresh on window focus / persona switch)
  const refreshIssuesFromDataverse = useCallback(
    (engId: string, engAny?: any) => {
      fetchIssuesForEngagement(engId).then((data) => {
        if (data && data.length > 0) {
          const sequenced = sortAndSequenceIssues(data);
          setIssues(sequenced);
          setSelectedIssueId((prev) => prev || sequenced[0].id);
          if (engAny && (sequenced[0] as any).businessResponseRequested !== undefined) {
            engAny.businessResponseRequested = Boolean((sequenced[0] as any).businessResponseRequested);
          }
        } else if (!engAny?.issuesList || engAny.issuesList.length === 0) {
          dataverseService.getIssuesByEngagementId(engId).then((fallbackData) => {
            if (fallbackData && fallbackData.length > 0) {
              const sequenced = sortAndSequenceIssues(fallbackData);
              setIssues(sequenced);
              setSelectedIssueId((prev) => prev || sequenced[0].id);
            } else {
              setIssues([]);
            }
          });
        }
      });
    },
    [sortAndSequenceIssues]
  );

  useEffect(() => {
    const engId = selectedEngagementId || activeEngagement?.id;
    if (!engId) return;

    // 1. If activeEngagement has issuesList in memory, seed immediately for instant UI responsiveness
    const engAny = activeEngagement as any;
    if (engAny?.issuesList && engAny.issuesList.length > 0) {
      const sequenced = sortAndSequenceIssues(engAny.issuesList);
      setIssues((prev) => (prev.length > 0 ? prev : sequenced));
      setSelectedIssueId((prev) => prev || sequenced[0].id);
    }

    // 2. Always fetch live issues from Dataverse Reporting Service to ensure exact table values
    refreshIssuesFromDataverse(engId, engAny);

    // 3. Re-fetch when user switches back to this browser tab (e.g., after editing Dataverse table directly)
    const handleFocus = () => {
      refreshIssuesFromDataverse(engId, engAny);
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [selectedEngagementId, activeEngagement, currentUser?.userId, currentRole, refreshIssuesFromDataverse]);

  // Load comments & audit logs for active issue and engagement
  useEffect(() => {
    const engId = selectedEngagementId || (activeEngagement as any)?.id;
    if (selectedIssueId || engId) {
      dataverseService.getCommentsByIssueId(selectedIssueId || '', engId).then((comms) => {
        setComments(comms || []);
      });
      if (selectedIssueId) {
        dataverseService.getAuditTrailLogs('cr_issue', selectedIssueId).then((logs) => {
          setAuditLogs(logs || []);
        });
      }
    }
  }, [selectedIssueId, selectedEngagementId, activeEngagement]);

  const selectedIssue = issues.find((i) => i.id === selectedIssueId) || issues[0] || null;

  // Filter active (non-excluded) issues for review progression
  const activeIssues = useMemo(
    () => issues.filter((i) => i.status !== 'Excluded' && !(i as any).isExcluded),
    [issues]
  );

  // Check if engagement has any active Critical finding
  const hasCriticalFinding = useMemo(
    () => activeIssues.some((i) => (i.criticality || (i as any).severity) === 'Critical'),
    [activeIssues]
  );


  // Role-based Issue Editability Check
  const checkIssueEditability = useCallback(
    (item: Issue | null) => {
      if (!item) return { canEdit: true, reason: null };

      // If Global Administrator is not staffed on this engagement, enforce Read-Only Oversight Mode
      if (isUnassignedAdmin) {
        return {
          canEdit: false,
          reason: 'Administrator Oversight Mode (Read-Only). You have full portfolio visibility, but to edit findings or advance review tiers, use "Impersonate User" to act on behalf of an assigned auditor.'
        };
      }

      // Staffed Global Administrators, VPs, and Heads have full cross-domain authority
      if (effectiveIsAdmin) {
        return { canEdit: true, reason: null };
      }

      const roleDetails = getRoleDetails(currentRole);
      if (roleDetails.baseRole === 'vp' || roleDetails.domain === 'General') {
        return { canEdit: true, reason: null };
      }

      const fn = (item.function || (item as any).functionType || '').toUpperCase();
      let isIT = false;
      if (fn.includes('FINOPS') || fn.includes('FIN')) {
        isIT = false;
      } else if (fn.includes('IT')) {
        isIT = true;
      } else {
        const testProc = (item.testProcedureCode || (item as any).testProcedure || '').toUpperCase();
        const acct = (item.accountableFunction || '').toUpperCase();
        if (acct.includes('FINOPS') || acct.includes('FINANCE')) {
          isIT = false;
        } else if (acct.includes('IT')) {
          isIT = true;
        } else {
          isIT = testProc.includes('TP-101') || testProc.includes('TP-102') || testProc.includes('TP-110');
        }
      }

      const isITRole = roleDetails.domain === 'IT';
      const isFinOpsRole = roleDetails.domain === 'FinOps';

      if (isITRole && !isIT) {
        return {
          canEdit: false,
          reason: `As an IT reviewer, you can only modify IT findings. This finding belongs to FinOps.`,
        };
      }

      if (isFinOpsRole && isIT) {
        return {
          canEdit: false,
          reason: `As a FinOps reviewer, you can only modify FinOps findings. This finding belongs to IT.`,
        };
      }

      return { canEdit: true, reason: null };
    },
    [currentRole, effectiveIsAdmin]
  );

  const { canEdit, reason: editRestrictionReason } = checkIssueEditability(selectedIssue);

  // Synchronize issues and sequential numbering (active first, excluded at the bottom, persisted to Dataverse)
  const updateIssuesAndSync = (newIssues: Issue[]) => {
    const activePart = newIssues.filter((i) => !i.isExcluded && i.status !== 'Excluded');
    const excludedPart = newIssues.filter((i) => i.isExcluded || i.status === 'Excluded');
    const sequenced = [...activePart, ...excludedPart].map((item, idx) => ({
      ...item,
      reportRef: idx + 1,
      reportReference: idx + 1,
    }));
    setIssues(sequenced);
    const engId = selectedEngagementId || (activeEngagement as any)?.id;
    if (activeEngagement) {
      (activeEngagement as any).issuesList = sequenced;
    }
    dataverseService.syncIssueReportReferences(sequenced, engId).catch(() => { });
  };

  const fieldSaveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleUpdateIssue = (updated: Issue) => {
    const prevIssue = issues.find((i) => i.id === updated.id);
    const engId = selectedEngagementId || (activeEngagement as any)?.id;
    if (prevIssue && updated.criticality !== prevIssue.criticality && updated.criticality) {
      updateIssueCriticalityInDataverse(updated.id, updated.criticality, engId).catch(() => { });
    }
    if (fieldSaveTimeoutRef.current) {
      clearTimeout(fieldSaveTimeoutRef.current);
    }
    fieldSaveTimeoutRef.current = setTimeout(() => {
      updateDataverseIssueFields(updated, engId).catch(() => { });
    }, 600);
    setIssues((prev) => prev.map((i) => (i.id === updated.id ? updated : i)));
  };

  // Reorder Handler with priority change detection
  const handleReorderIssues = (
    newIssues: Issue[],
    isCrossPriority?: boolean,
    fromCrit?: string,
    toCrit?: string
  ) => {
    updateIssuesAndSync(newIssues);

    if (isCrossPriority && fromCrit && toCrit) {
      setToastMessage({
        title: 'Priority Alignment Notice',
        message: `You are moving an issue across priority levels (${fromCrit} ➔ ${toCrit}). Report reference numbers have been realigned.`,
        severity: 'warning',
      });
    }
  };

  // Exclude Issue Handler - Opens modal for mandatory justification
  const handleMarkExcludeIssue = (issueId: string) => {
    const cleanId = extractCleanGuid(issueId).toLowerCase();
    const target = issues.find((i) => i.id === issueId || (cleanId && extractCleanGuid(i.id).toLowerCase() === cleanId));
    if (!target) return;
    setIssueToExclude(target);
    setIsExcludeModalOpen(true);
  };

  // Confirm Exclusion with full Dataverse persistence & GxP audit logging
  const handleConfirmExclude = async (issueId: string, reason: string) => {
    const cleanId = extractCleanGuid(issueId).toLowerCase();
    const target = issues.find((i) => i.id === issueId || (cleanId && extractCleanGuid(i.id).toLowerCase() === cleanId));
    if (!target) return;
    const engId = selectedEngagementId || (activeEngagement as any)?.id || '';

    try {
      if (target.isLocked) {
        await releaseIssueLock(
          target.id,
          engId,
          currentUser,
          `Lock released upon exclusion`
        );
      }

      // Excluded issue moves to the bottom of the list with highest available ref number
      const remainingActive = issues
        .filter((i) => i.id !== issueId && extractCleanGuid(i.id).toLowerCase() !== cleanId && !i.isExcluded && i.status !== 'Excluded')
        .sort((a, b) => (a.reportRef || 0) - (b.reportRef || 0));
      const existingExcluded = issues
        .filter((i) => i.id !== issueId && extractCleanGuid(i.id).toLowerCase() !== cleanId && (i.isExcluded || i.status === 'Excluded'))
        .sort((a, b) => (a.reportRef || 0) - (b.reportRef || 0));
      const highestRef = remainingActive.length + existingExcluded.length + 1;

      const updated = await dataverseService.excludeIssue(
        issueId,
        engId,
        currentUser,
        reason,
        highestRef
      );

      const updatedTarget: Issue = {
        ...target,
        ...updated,
        isExcluded: true,
        previousStatus: target.status !== 'Excluded' ? target.status : target.previousStatus || 'Pending TC',
        status: 'Excluded',
        currentLevel: 'Excluded',
        reportRef: highestRef,
        reportReference: highestRef,
        workflowRemarks: reason,
        excludedAt: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        isLocked: false,
        lockedBy: null,
        lockedAt: null,
      };

      const newIssues = [...remainingActive, ...existingExcluded, updatedTarget];
      setSelectedIssueId(issueId);
      updateIssuesAndSync(newIssues);

      setToastMessage({
        message: `Finding "${target.title}" excluded and moved to bottom (Ref #${highestRef}).`,
        severity: 'info',
      });
    } catch (err: any) {
      setToastMessage({
        message: err?.message || 'Failed to exclude issue in Dataverse.',
        severity: 'error',
      });
    }
  };

  // Include Issue Handler with Dataverse wiring: sets Ref # to highest active + 1 and status back to Pending Staff of that function
  const handleIncludeIssue = async (issueId: string) => {
    const cleanId = extractCleanGuid(issueId).toLowerCase();
    const target = issues.find((i) => i.id === issueId || (cleanId && extractCleanGuid(i.id).toLowerCase() === cleanId));
    if (!target) return;
    const engId = selectedEngagementId || (activeEngagement as any)?.id || '';
    const assignedUsers = (activeEngagement as any)?.assignedUsers || [];

    try {
      const active = issues
        .filter((i) => i.id !== issueId && extractCleanGuid(i.id).toLowerCase() !== cleanId && !i.isExcluded && i.status !== 'Excluded')
        .sort((a, b) => (a.reportRef || 0) - (b.reportRef || 0));
      const excluded = issues
        .filter((i) => i.id !== issueId && extractCleanGuid(i.id).toLowerCase() !== cleanId && (i.isExcluded || i.status === 'Excluded'))
        .sort((a, b) => (a.reportRef || 0) - (b.reportRef || 0));

      const highestActiveRef = active.reduce((max, item, idx) => Math.max(max, Number(item.reportRef || idx + 1)), 0);
      const newRefNumber = highestActiveRef + 1;

      const updated = await dataverseService.includeIssue(
        issueId,
        engId,
        currentUser,
        `Restored and included in report by ${currentUser?.name || 'Reviewer'}`,
        'Pending Staff',
        assignedUsers,
        target,
        newRefNumber
      );

      const restoredTarget: Issue = {
        ...target,
        ...updated,
        isExcluded: false,
        status: 'Pending Staff',
        currentLevel: 'Pending Staff',
        currentOwner: updated.currentOwner || target.currentOwner,
        owner: updated.currentOwner || (target as any).owner,
        reportRef: newRefNumber,
        reportReference: newRefNumber,
        excludedAt: null,
        isLocked: false,
        lockedBy: null,
        lockedAt: null,
      };

      // Re-insert right after active issues (highest active ref + 1) and before any remaining excluded issues
      const newIssues = [...active, restoredTarget, ...excluded];
      setSelectedIssueId(issueId);
      updateIssuesAndSync(newIssues);

      const fnLabel = (restoredTarget.function || (restoredTarget as any).tech || 'IT') === 'FinOps' ? 'FinOps' : 'IT';
      setToastMessage({
        message: `Finding "${target.title}" restored as Ref #${newRefNumber} in Pending Staff (${fnLabel}).`,
        severity: 'success',
      });
    } catch (err: any) {
      setToastMessage({
        message: err?.message || 'Failed to restore issue in Dataverse.',
        severity: 'error',
      });
    }
  };

  // User Identity & Lock State Helpers
  const currentUserName = (currentUser?.name || '').trim().toLowerCase();
  const currentUserId = (currentUser?.userId || (currentUser as any)?.id || '').trim().toLowerCase();
  const currentUserEmail = (currentUser?.email || '').trim().toLowerCase();

  const isSelectedIssueLockedByMe = useMemo(() => {
    if (!selectedIssue || !selectedIssue.isLocked) return false;
    const lName = (selectedIssue.lockedBy?.name || '').trim().toLowerCase();
    const lId = (selectedIssue.lockedBy?.userId || '').trim().toLowerCase();
    const lEmail = (selectedIssue.lockedBy?.email || '').trim().toLowerCase();
    return Boolean(
      (currentUserId && lId && currentUserId === lId) ||
      (currentUserEmail && lEmail && currentUserEmail === lEmail) ||
      (currentUserName && lName && currentUserName === lName)
    );
  }, [selectedIssue, currentUserId, currentUserEmail, currentUserName]);

  // Stale Lock Check & Eviction upon issue selection (> 1 hour old without active session)
  useEffect(() => {
    if (selectedIssue && selectedIssue.isLocked && selectedIssue.lockedAt) {
      const lockAge = Date.now() - new Date(selectedIssue.lockedAt).getTime();
      if (lockAge > 3600000) {
        console.info('[AuditReportStudioView] Evicting stale lock on selected issue:', selectedIssue.id);
        const engId = selectedEngagementId || (activeEngagement as any)?.id;
        releaseIssueLock(selectedIssue.id, engId, currentUser, 'Stale lock evicted (>1 hour idle lease)').then(() => {
          handleUpdateIssue({
            ...selectedIssue,
            isLocked: false,
            lockedBy: null,
            lockedAt: null,
          });
          setToastMessage({
            message: `Previous editing session on Finding #${selectedIssue.reportRef || selectedIssue.id} expired (>1 hour) and was automatically released.`,
            severity: 'info',
          });
        });
      }
    }
  }, [selectedIssue?.id, selectedIssue?.isLocked, selectedIssue?.lockedAt]);

  // Release lock on navigation away (switching issues)
  const prevIssueIdRef = useRef<string | null>(null);
  useEffect(() => {
    const prevId = prevIssueIdRef.current;
    if (prevId && prevId !== selectedIssue?.id) {
      const prevIssue = issues.find((i) => i.id === prevId);
      const prevLockedByMe = Boolean(
        prevIssue?.isLocked && (
          (currentUserId && prevIssue.lockedBy?.userId?.toLowerCase() === currentUserId) ||
          (currentUserName && prevIssue.lockedBy?.name?.toLowerCase() === currentUserName)
        )
      );
      if (prevLockedByMe) {
        const engId = selectedEngagementId || (activeEngagement as any)?.id;
        releaseIssueLock(prevId, engId, currentUser, 'Navigated to another finding');
        setIssues((prev) =>
          prev.map((i) => (i.id === prevId ? { ...i, isLocked: false, lockedBy: null, lockedAt: null } : i))
        );
      }
    }
    prevIssueIdRef.current = selectedIssue?.id || null;
  }, [selectedIssue?.id, issues, currentUserId, currentUserName, selectedEngagementId, activeEngagement, currentUser]);

  // Release lock on browser tab unload or studio unmount
  useEffect(() => {
    const handleBeforeUnload = () => {
      const activeId = prevIssueIdRef.current;
      if (activeId) {
        const engId = selectedEngagementId || (activeEngagement as any)?.id;
        releaseIssueLock(activeId, engId, currentUser, 'Browser window unloaded');
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      const activeId = prevIssueIdRef.current;
      if (activeId) {
        const engId = selectedEngagementId || (activeEngagement as any)?.id;
        releaseIssueLock(activeId, engId, currentUser, 'Closed or navigated away from studio view');
      }
    };
  }, [currentUser, selectedEngagementId, activeEngagement]);

  // Implicit Lock Acquisition (when active auditor modifies or focuses any field)
  const handleAcquireLock = async (issueId: string) => {
    const target = issues.find((i) => i.id === issueId);
    if (!target || target.isLocked) return;
    const engId = selectedEngagementId || (activeEngagement as any)?.id;
    try {
      const lockRes = await acquireIssueLock(issueId, engId, currentUser);
      const updatedTarget: Issue = {
        ...target,
        isLocked: true,
        lockedBy: lockRes.lockedBy,
        lockedAt: lockRes.lockedAt,
      };
      handleUpdateIssue(updatedTarget);
    } catch (err) {
      console.warn('[AuditReportStudioView] Implicit lock acquisition failed:', err);
    }
  };

  // Lock Release Handler
  const handleReleaseLock = async (issueId: string, reason?: string) => {
    const target = issues.find((i) => i.id === issueId);
    if (!target) return;
    const engId = selectedEngagementId || (activeEngagement as any)?.id;
    try {
      await releaseIssueLock(issueId, engId, currentUser, reason);
      const updatedTarget: Issue = {
        ...target,
        isLocked: false,
        lockedBy: null,
        lockedAt: null,
      };
      handleUpdateIssue(updatedTarget);
    } catch (err) {
      console.warn('[AuditReportStudioView] Lock release failed:', err);
    }
  };

  // 1-Hour Inactivity Watchdog with 59-min Countdown Warning Alert
  const {
    isWarningOpen,
    secondsRemaining,
    handleKeepWorking,
    handleManualUnlock,
  } = useInactivityLockWatchdog({
    isLockedByCurrentUser: isSelectedIssueLockedByMe,
    issueId: selectedIssue?.id || null,
    onAutoUnlock: async () => {
      if (selectedIssue?.id) {
        await handleReleaseLock(selectedIssue.id, 'Auto-unlocked due to 1-hour inactivity');
        setToastMessage({
          message: 'Finding automatically unlocked due to 1 hour of inactivity.',
          severity: 'info',
        });
      }
    },
  });

  // Lock / Unlock Toggle Handler
  const handleToggleLock = async (issueId: string) => {
    const target = issues.find((i) => i.id === issueId);
    if (!target) return;
    const engId = selectedEngagementId || (activeEngagement as any)?.id;

    if (target.isLocked) {
      const tLockedByName = (target.lockedBy?.name || '').trim().toLowerCase();
      const tLockedById = (target.lockedBy?.userId || '').trim().toLowerCase();
      const isHolder = Boolean(
        (currentUserId && tLockedById && currentUserId === tLockedById) ||
        (currentUserName && tLockedByName && currentUserName === tLockedByName)
      );
      if (!isHolder) {
        setToastMessage({
          message: `Cannot unlock: finding is currently locked by ${target.lockedBy?.name || 'another auditor'}.`,
          severity: 'warning',
        });
        return;
      }

      await releaseIssueLock(
        issueId,
        engId,
        currentUser,
        'Auditor unlocked'
      );
      const updatedTarget: Issue = {
        ...target,
        isLocked: false,
        lockedBy: null,
        lockedAt: null,
      };
      handleUpdateIssue(updatedTarget);
      setToastMessage({
        message: `Finding #${target.reportRef || issueId} has been unlocked.`,
        severity: 'info',
      });
    } else {
      const lockRes = await acquireIssueLock(issueId, engId, currentUser);
      const updatedTarget: Issue = {
        ...target,
        isLocked: true,
        lockedBy: lockRes.lockedBy,
        lockedAt: lockRes.lockedAt,
      };
      handleUpdateIssue(updatedTarget);
      setToastMessage({
        message: `Finding #${target.reportRef || issueId} is now locked for editing.`,
        severity: 'info',
      });
    }
  };

  // Mark Not My Function Issue Handler - Toggles function track between IT and FinOps with Dataverse wiring & GxP audit logging
  const handleMarkNotAnIssue = async (issueId: string) => {
    const cleanId = extractCleanGuid(issueId).toLowerCase();
    const target = issues.find((i) => i.id === issueId || (cleanId && extractCleanGuid(i.id).toLowerCase() === cleanId));
    if (!target) return;
    const engId = selectedEngagementId || (activeEngagement as any)?.id || '';

    const currentFn = (target.function || (target.tech === 'FinOps' ? 'FinOps' : 'IT')) as 'IT' | 'FinOps';
    const nextFn: 'IT' | 'FinOps' = currentFn === 'IT' ? 'FinOps' : 'IT';

    try {
      await dataverseService.toggleIssueFunction(issueId, engId, currentUser, nextFn);

      const updatedTarget: Issue = {
        ...target,
        function: nextFn,
        tech: nextFn,
      };
      handleUpdateIssue(updatedTarget);

      setToastMessage({
        message: `Function successfully updated to ${nextFn} (switched from ${currentFn}) via "Mark Not My Function".`,
        severity: 'success',
      });
    } catch (err: any) {
      console.warn('[AuditReportStudioView] Notice toggling function in Dataverse:', err);
      const updatedTarget: Issue = {
        ...target,
        function: nextFn,
        tech: nextFn,
      };
      handleUpdateIssue(updatedTarget);

      setToastMessage({
        message: `Function updated locally to ${nextFn}.`,
        severity: 'info',
      });
    }
  };

  // Call Back Handlers
  const handleOpenCallback = (issueId: string) => {
    setCallbackIssueId(issueId);
    setIsCallbackModalOpen(true);
  };

  const handleConfirmCallback = async (issueId: string, reason: string, targetStatus: string) => {
    try {
      const engId = selectedEngagementId || (activeEngagement as any)?.id;
      const updated = await dataverseService.callBackIssue(issueId, engId, currentUser, reason, targetStatus);
      setIssues((prev) =>
        prev.map((item) =>
          item.id === issueId || extractCleanGuid(item.id) === extractCleanGuid(issueId)
            ? {
              ...item,
              status: updated.status,
              currentOwner: currentUser?.name || 'Reviewer',
              workflowRemarks: reason,
              callbackReason: reason,
              callbackTimestamp: new Date().toISOString(),
              isLocked: false,
              lockedBy: null,
              lockedAt: null,
            }
            : item
        )
      );
      setToastMessage({
        message: `Issue called back to ${updated.status}: "${reason}"`,
        severity: 'info',
      });
    } catch (err: any) {
      setToastMessage({
        message: err?.message || 'Failed to call back issue.',
        severity: 'error',
      });
    }
  };

  // Send To Peer Handlers
  const handleOpenSendTo = (issueId: string) => {
    setSendToIssueId(issueId);
    setIsSendToModalOpen(true);
  };

  const handleConfirmSendTo = async (issueId: string, recipient: any, remarks: string) => {
    try {
      const engId = selectedEngagementId || (activeEngagement as any)?.id;
      const updated = await dataverseService.sendToPeer(issueId, engId, currentUser, recipient, remarks);
      setIssues((prev) =>
        prev.map((item) =>
          item.id === issueId || extractCleanGuid(item.id) === extractCleanGuid(issueId)
            ? {
              ...item,
              status: updated.status,
              currentOwner: recipient.displayName || recipient.name,
              workflowRemarks: remarks,
              isLocked: false,
              lockedBy: null,
              lockedAt: null,
            }
            : item
        )
      );
      setToastMessage({
        message: `Issue successfully handed over to ${recipient.displayName || recipient.name} (${updated.status}).`,
        severity: 'success',
      });
    } catch (err: any) {
      setToastMessage({
        message: err?.message || 'Failed to send issue to peer.',
        severity: 'error',
      });
    }
  };

  const handleAdvanceWorkflow = async (targetStatus: IssueStatus, remarks?: string) => {
    if (!selectedIssue) return;
    const engId = selectedEngagementId || (activeEngagement as any)?.id;
    const roleDetails = getRoleDetails(currentRole);
    const isMgr = roleDetails.baseRole === 'manager' || effectiveIsAdmin;

    try {
      if (selectedIssue.isLocked) {
        await releaseIssueLock(
          selectedIssue.id,
          engId,
          currentUser,
          `Workflow advanced to ${targetStatus}`
        );
      }

      // If Audit Manager is submitting an issue (or Manager preempts a lower-tier issue):
      const isManagerWorkflowSubmission =
        isMgr &&
        (selectedIssue.status === 'Pending Manager' ||
          selectedIssue.status === 'Pending Staff' ||
          selectedIssue.status === 'Pending TC' ||
          targetStatus === 'Ready for Director Submission' ||
          targetStatus === ('Manager Completed (Waiting for Other Issues)' as any));

      const assignedUsers = (activeEngagement as any)?.assignedUsers || [];

      if (isManagerWorkflowSubmission) {
        const result = await dataverseService.managerSubmitIssueWorkflow(
          selectedIssue.id,
          engId,
          issues,
          remarks,
          currentUser,
          assignedUsers
        );
        // Batch update state
        setIssues((prev) =>
          prev.map((item) => {
            const found = result.updatedIssues.find(
              (u) => u.id === item.id || extractCleanGuid(u.id) === extractCleanGuid(item.id)
            );
            return found
              ? {
                ...item,
                ...found,
                title: found.title || item.title,
                criticality: found.criticality || item.criticality,
                testProcedureCode: found.testProcedureCode || item.testProcedureCode,
                status: (found.status || result.nextStatus) as any,
                currentOwner: found.currentOwner || item.currentOwner,
                isLocked: false,
                lockedBy: null,
              }
              : item;
          })
        );
        if (result.isBatchReadyForDirector) {
          setToastMessage({
            message: 'All issues completed by Manager! Batch is now Ready for Director Submission.',
            severity: 'success',
          });
        } else {
          setToastMessage({
            message: 'Issue submitted by Manager (Waiting for Other Issues).',
            severity: 'info',
          });
        }
        return;
      }

      // Single issue workflow advancement (Staff -> Pending TC, TC -> Pending Manager, Business -> Pending Manager)
      const updated = await dataverseService.advanceIssueWorkflow(
        selectedIssue.id,
        engId,
        targetStatus,
        remarks,
        currentUser,
        assignedUsers,
        selectedIssue
      );
      setIssues((prev) =>
        prev.map((item) =>
          item.id === selectedIssue.id || extractCleanGuid(item.id) === extractCleanGuid(selectedIssue.id)
            ? {
              ...item,
              ...updated,
              title: updated.title || item.title,
              criticality: updated.criticality || item.criticality,
              testProcedureCode: updated.testProcedureCode || item.testProcedureCode,
              status: targetStatus,
              currentOwner: updated.currentOwner || item.currentOwner,
              isLocked: false,
              lockedBy: null,
              workflowRemarks: remarks
            }
            : item
        )
      );
      setToastMessage({ message: `Workflow status advanced to ${targetStatus}`, severity: 'success' });
    } catch (err: any) {
      console.warn('[AuditReportStudioView] Error advancing workflow:', err);
      const assigned = (activeEngagement as any)?.assignedUsers || [];
      const resolveRoleOwner = (roleType: string) => {
        const match = assigned.find((u: any) => {
          const { baseRole } = getRoleDetails(u.roleId || u.roleName);
          return baseRole === roleType;
        });
        return match?.displayName || match?.name;
      };
      const fallbackOwner =
        (targetStatus.includes('TC') && resolveRoleOwner('team-coordinator')) ||
        (targetStatus.includes('Manager') && resolveRoleOwner('manager')) ||
        (targetStatus.includes('Director') && resolveRoleOwner('director')) ||
        (targetStatus.includes('VP') && resolveRoleOwner('vp')) ||
        currentUser?.name ||
        selectedIssue.currentOwner ||
        '';
      const updatedLocal = {
        ...selectedIssue,
        status: targetStatus,
        currentOwner: fallbackOwner,
        isLocked: false,
        lockedBy: null,
        lockedAt: null,
        workflowRemarks: remarks
      };
      handleUpdateIssue(updatedLocal);
      setToastMessage({ message: `Workflow status advanced to ${targetStatus}`, severity: 'success' });
    }
  };

  const handleTriggerAiSynthesis = () => {
    if (!selectedIssue) return;
    setIsAiSynthesizing(true);
    setTimeout(() => {
      setIsAiSynthesizing(false);
      setIsAiCompareOpen(true);
    }, 1200);
  };

  const handleApplyAiMerge = (mergedFields: Partial<Issue>) => {
    if (!selectedIssue) return;
    const updated = {
      ...selectedIssue,
      ...mergedFields,
      activeAiVersionNumber: (selectedIssue.activeAiVersionNumber || 1) + 1,
    };
    handleUpdateIssue(updated);
    setToastMessage({ message: `Adopted AI synthesis (v${updated.activeAiVersionNumber})`, severity: 'success' });
  };

  const handleCreateNewIssue = async (newIssueData: Partial<Issue>, statusAction?: 'draft' | 'submit') => {
    try {
      const engId = selectedEngagementId || (activeEngagement as any)?.id || '';
      const assignedUsers = (activeEngagement as any)?.assignedUsers || [];
      const currentActiveIssues = issues.filter((i) => !i.isExcluded && i.status !== 'Excluded');
      const currentExcludedIssues = issues.filter((i) => i.isExcluded || i.status === 'Excluded');
      const nextActiveRef = currentActiveIssues.length + 1;

      const created = await createDataverseIssue(
        {
          engagementId: engId,
          ...newIssueData,
          reportRef: nextActiveRef,
          function: (newIssueData.function === 'FinOps' ? 'FinOps' : 'IT') as 'IT' | 'FinOps'
        } as any,
        currentUser,
        assignedUsers
      );

      const targetStatus = (newIssueData.status as any) || (statusAction === 'submit' ? 'Pending TC' : 'Pending Staff');
      const resolveRoleOwner = (roleType: string) => {
        const match = assignedUsers.find((u: any) => {
          const { baseRole } = getRoleDetails(u.roleId || u.roleName);
          return baseRole === roleType;
        });
        return match?.displayName || match?.name;
      };
      const fallbackOwner =
        (targetStatus.includes('TC') && resolveRoleOwner('team-coordinator')) ||
        (targetStatus.includes('Manager') && resolveRoleOwner('manager')) ||
        (targetStatus.includes('Director') && resolveRoleOwner('director')) ||
        (targetStatus.includes('VP') && resolveRoleOwner('vp')) ||
        currentUser?.name ||
        'Assigned Auditor';

      const issueToAdd: Issue = created?.issue || {
        id: created?.iar_issuesid || `ISSUE-${Date.now().toString().slice(-4)}`,
        jobId: engId,
        engagementId: engId,
        title: newIssueData.title || 'New Audit Finding',
        testProcedureCode: newIssueData.testProcedureCode || 'TP-101',
        criticality: (newIssueData.criticality || '') as any,
        status: targetStatus,
        currentLevel: targetStatus,
        currentOwner: created?.currentOwner || fallbackOwner,
        issueNarrative:
          (newIssueData as any).issueNarrative || 'Initial observations documented during field testing.',
        rootCause: (newIssueData as any).rootCause || 'Under investigation.',
        impact: (newIssueData as any).impact || 'Under assessment.',
        recommendation: (newIssueData as any).recommendation || 'Standardize monitoring controls.',
        accountableContact: (newIssueData as any).accountableContact || 'Business Owner',
        agreedRemediationDate:
          (newIssueData as any).agreedRemediationDate ||
          new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        activeAiVersionNumber: newIssueData.activeAiVersionNumber || 1,
        reportRef: nextActiveRef,
        reportReference: nextActiveRef,
        ...newIssueData,
      };

      const newIssues = [...currentActiveIssues, issueToAdd, ...currentExcludedIssues];
      updateIssuesAndSync(newIssues);
      setSelectedIssueId(issueToAdd.id);

      if (activeEngagement) {
        setActiveEngagement({
          ...activeEngagement,
          issuesList: newIssues,
          status: (activeEngagement as any).status === 'Not Started' ? 'In Progress' : (activeEngagement as any).status,
          subStatus: 'Audit Report In Progress',
          workflowStatus: 'Audit Report In Progress'
        } as any);
      }

      const isSubmitted = statusAction === 'submit' || (issueToAdd.status && !issueToAdd.status.includes('Draft') && !issueToAdd.status.includes('Staff'));
      setToastMessage({
        title: isSubmitted ? 'Finding Submitted Successfully' : 'Finding Saved as Draft',
        message: `Finding #${issueToAdd.id} (${issueToAdd.title}) recorded in Dataverse report.`,
        severity: 'success',
      });
    } catch (err: any) {
      console.error('[AuditReportStudioView] Error creating finding in Dataverse:', err);
      setToastMessage({
        title: 'Error Saving Finding',
        message: err?.message || 'Could not persist finding to Dataverse.',
        severity: 'error',
      });
    } finally {
      setIsCreateOpen(false);
    }
  };

  const handleAddComment = async (fieldKey: string, fieldLabel: string, content: string, taggedUser?: CommentUser) => {
    if (!selectedIssue) return;

    try {
      const newComment = await dataverseService.addComment({
        issueId: selectedIssue.id,
        engagementId: activeEngagement?.id || selectedIssue.engagementId,
        fieldKey,
        content,
        authorId: currentUser?.userId || 'USR-001',
        authorName: currentUser?.name || 'Current Auditor',
        authorEmail: currentUser?.email,
        taggedUserId: taggedUser?.userId,
        taggedUserName: taggedUser?.name,
      });

      setComments((prev) => [...prev, newComment]);
      setToastMessage({ message: `Comment posted on ${fieldLabel}`, severity: 'info' });
    } catch (err: any) {
      console.error('[AuditReportStudioView] Error adding comment:', err);
      setToastMessage({ message: `Failed to post comment: ${err?.message || 'Dataverse error'}`, severity: 'error' });
    }
  };

  const handleResolveComment = async (commentId: string) => {
    try {
      const resolved = await dataverseService.resolveComment(
        commentId,
        currentUser?.userId || 'USR-001',
        currentUser?.name || 'Reviewer'
      );
      setComments((prev) =>
        prev.map((c) =>
          c.commentId === commentId
            ? {
              ...c,
              isResolved: true,
              resolvedById: resolved.resolvedById || currentUser?.userId || 'USR-001',
              resolvedByName: currentUser?.name || resolved.resolvedByName || 'Reviewer',
              resolvedAt: resolved.resolvedAt || new Date().toISOString(),
            }
            : c
        )
      );
      setToastMessage({ message: 'Comment thread marked as done', severity: 'info' });
    } catch (err: any) {
      console.error('[AuditReportStudioView] Error resolving comment:', err);
      setToastMessage({ message: `Failed to resolve comment: ${err?.message || 'Dataverse error'}`, severity: 'error' });
    }
  };

  // Report-Level Action Handlers
  const [reportRemarksConfig, setReportRemarksConfig] = useState<{
    isOpen: boolean;
    title: string;
    actionLabel: string;
    currentStatus?: string;
    targetStatus: string;
    actionType: 'submit-director' | 'submit-business' | 'submit-vp' | 'sign-off';
  } | null>(null);

  const handleManagerSubmitToDirector = async (remarks?: string) => {
    const engId = selectedEngagementId || (activeEngagement as any)?.id;
    const assignedUsers = (activeEngagement as any)?.assignedUsers || [];
    try {
      const updatedList = await dataverseService.batchAdvanceEngagementIssues(
        engId,
        issues,
        'Pending Director',
        remarks || `Audit Report batch submitted to Audit Director by ${currentUser?.name || 'Manager'}`,
        currentUser,
        assignedUsers
      );
      setIssues((prev) =>
        prev.map((item) => {
          const found = updatedList.find((u) => u.id === item.id || extractCleanGuid(u.id) === extractCleanGuid(item.id));
          return found
            ? {
              ...item,
              ...found,
              title: found.title || item.title,
              criticality: found.criticality || item.criticality,
              testProcedureCode: found.testProcedureCode || item.testProcedureCode,
              status: 'Pending Director',
              currentOwner: found.currentOwner || 'Marcus Vance',
              isLocked: false,
              lockedBy: null
            }
            : item;
        })
      );
      setToastMessage({
        message: 'Audit Report successfully submitted to Audit Director for review.',
        severity: 'success',
      });
    } catch (err: any) {
      setToastMessage({
        message: `Failed to submit to Director: ${err?.message || 'Dataverse error'}`,
        severity: 'error',
      });
    }
  };

  const handleDirectorSubmitToBusiness = async (remarks?: string) => {
    const engId = selectedEngagementId || (activeEngagement as any)?.id;
    const assignedUsers = (activeEngagement as any)?.assignedUsers || [];
    try {
      const updatedList = await dataverseService.batchAdvanceEngagementIssues(
        engId,
        issues,
        'Pending Business',
        remarks || `Audit findings submitted to Business Management by ${currentUser?.name || 'Director'}`,
        currentUser,
        assignedUsers
      );
      setIssues((prev) =>
        prev.map((item) => {
          const found = updatedList.find((u) => u.id === item.id || extractCleanGuid(u.id) === extractCleanGuid(item.id));
          return found
            ? {
              ...item,
              ...found,
              title: found.title || item.title,
              criticality: found.criticality || item.criticality,
              testProcedureCode: found.testProcedureCode || item.testProcedureCode,
              status: 'Pending Business',
              currentOwner: found.currentOwner || item.primaryBusinessOwnerName || item.accountableContact || 'Business Owner',
              businessResponseStatus: 'Pending with Business',
              businessResponseRequested: true,
              workflowRemarks: remarks || 'Submitted to Business Management',
              isLocked: false,
              lockedBy: null
            } as any
            : item;
        })
      );
      if (activeEngagement) {
        (activeEngagement as any).businessResponseRequested = true;
      }
      setToastMessage({
        message: 'Findings submitted to Business Management for formal response.',
        severity: 'success',
      });
    } catch (err: any) {
      setToastMessage({
        message: `Failed to submit to Business: ${err?.message || 'Dataverse error'}`,
        severity: 'error',
      });
    }
  };

  // Business Management Response On-Behalf Submission Handler
  const handleSaveBusinessResponseOnBehalf = async (
    issueId: string,
    responseData: { reason: string; response: string; attachment?: string; targetDate?: string }
  ) => {
    const cleanId = extractCleanGuid(issueId).toLowerCase();
    const target = issues.find((i) => i.id === issueId || (cleanId && extractCleanGuid(i.id).toLowerCase() === cleanId));
    if (!target) return;
    const engId = selectedEngagementId || (activeEngagement as any)?.id || '';
    const assignedUsers = (activeEngagement as any)?.assignedUsers || [];

    try {
      const updated = await dataverseService.saveBusinessResponseOnBehalf(
        issueId,
        engId,
        currentUser,
        {
          businessManagementResponse: responseData.response,
          businessManagementReason: responseData.reason,
          businessManagementAttachment: responseData.attachment,
          agreedRemediationDate: responseData.targetDate,
        },
        target,
        assignedUsers
      );

      setIssues((prev) =>
        prev.map((i) =>
          i.id === issueId || (cleanId && extractCleanGuid(i.id).toLowerCase() === cleanId)
            ? updated
            : i
        )
      );

      const isPendingBiz = target.status === 'Pending Business' || (target as any).currentLevel === 'Pending Business';
      setToastMessage({
        message: isPendingBiz
          ? 'Business response saved on-behalf. Finding automatically returned to Pending Manager for supervisory validation.'
          : 'Business response saved on-behalf successfully.',
        severity: 'success',
      });
    } catch (err: any) {
      console.warn('[AuditReportStudioView] Notice saving business response on behalf:', err);
      const nowFormatted = new Date().toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
      const updated: Issue = {
        ...target,
        businessManagementReason: responseData.reason,
        businessManagementResponse: responseData.response,
        managementResponse: responseData.response,
        businessManagementAttachment: responseData.attachment || '',
        businessResponseStatus: 'Completed',
        businessResponseBy: 'Audit Team',
        businessResponseProvidedBy: currentUser?.name || 'Auditor',
        businessResponseProvidedAt: new Date().toISOString(),
        businessResponseAddedOnBehalfBy: currentUser?.name || 'Auditor',
        businessResponseAddedOnBehalfRole: currentUser?.role || 'Auditor',
        businessResponseAddedOnBehalfAt: nowFormatted,
        agreedRemediationDate: responseData.targetDate || target.agreedRemediationDate,
        remediationTargetDate: responseData.targetDate || target.remediationTargetDate,
        status: target.status === 'Pending Business' ? 'Pending Manager' : target.status,
      };
      handleUpdateIssue(updated);
      setToastMessage({
        message: 'Business response saved locally.',
        severity: 'info',
      });
    }
  };

  const handleDirectorSubmitToVP = async (remarks?: string) => {
    const engId = selectedEngagementId || (activeEngagement as any)?.id;
    const assignedUsers = (activeEngagement as any)?.assignedUsers || [];
    try {
      const updatedList = await dataverseService.batchAdvanceEngagementIssues(
        engId,
        issues,
        'Pending VP',
        remarks || `Escalated to Vice President by ${currentUser?.name || 'Director'}`,
        currentUser,
        assignedUsers
      );
      setIssues((prev) =>
        prev.map((item) => {
          const found = updatedList.find((u) => u.id === item.id || extractCleanGuid(u.id) === extractCleanGuid(item.id));
          return found
            ? {
              ...item,
              ...found,
              title: found.title || item.title,
              criticality: found.criticality || item.criticality,
              testProcedureCode: found.testProcedureCode || item.testProcedureCode,
              status: 'Pending VP',
              currentOwner: found.currentOwner || 'Elena Rostova',
              isLocked: false,
              lockedBy: null
            }
            : item;
        })
      );
      setToastMessage({
        message: 'Audit Report successfully escalated to Vice President for sign-off.',
        severity: 'success',
      });
    } catch (err: any) {
      setToastMessage({
        message: `Failed to submit to VP: ${err?.message || 'Dataverse error'}`,
        severity: 'error',
      });
    }
  };

  const handleSignOffAuditReport = async (remarks?: string) => {
    const engId = selectedEngagementId || (activeEngagement as any)?.id;
    const assignedUsers = (activeEngagement as any)?.assignedUsers || [];
    try {
      const { updatedIssues } = await dataverseService.signOffAuditReport(
        engId,
        issues,
        currentUser,
        remarks || `Audit report officially completed and signed off by ${currentUser?.name || 'Reviewer'}`,
        assignedUsers
      );
      setIssues((prev) =>
        prev.map((item) => {
          const found = updatedIssues.find((u) => u.id === item.id || extractCleanGuid(u.id) === extractCleanGuid(item.id));
          return found
            ? {
              ...item,
              ...found,
              title: found.title || item.title,
              criticality: found.criticality || item.criticality,
              testProcedureCode: found.testProcedureCode || item.testProcedureCode,
              status: 'Completed',
              currentOwner: found.currentOwner || 'QA Archive',
              isLocked: false,
              lockedBy: null
            }
            : item;
        })
      );
      if (activeEngagement) {
        (activeEngagement as any).subStatus = 'Executive Report Inprogress';
        (activeEngagement as any).workflowStatus = 'Executive Report Inprogress';
      }
      setToastMessage({
        message: 'Audit Report officially signed off! Lifecycle transitioned to Executive Report Inprogress.',
        severity: 'success',
      });
    } catch (err: any) {
      setToastMessage({
        message: `Failed to sign off report: ${err?.message || 'Dataverse error'}`,
        severity: 'error',
      });
    }
  };

  // Calculate field comment counts for the selected issue
  const commentCounts = comments.reduce<Record<string, number>>((acc, c) => {
    if (!c.isResolved) {
      acc[c.fieldKey] = (acc[c.fieldKey] || 0) + 1;
    }
    return acc;
  }, {});

  const roleDetails = getRoleDetails(currentRole);
  const isDirector = roleDetails.baseRole === 'director';
  const isVP = roleDetails.baseRole === 'vp';
  const isManager = roleDetails.baseRole === 'manager';
  // Admin only acts as an operational reviewer if they are actually staffed on this engagement (Option A SoD rule)
  const isUserAdmin = effectiveIsAdmin && !isUnassignedAdmin;
  void isDirector;
  void isVP;
  void isManager;
  void isUserAdmin;

  const allReadyForDirector = activeIssues.length > 0 && activeIssues.every((i) => i.status === 'Ready for Director Submission');
  const allPendingDirector = activeIssues.length > 0 && activeIssues.every((i) => i.status === 'Pending Director');
  const allPendingVP = activeIssues.length > 0 && activeIssues.every((i) => i.status === 'Pending VP');
  const allCompleted = activeIssues.length > 0 && activeIssues.every((i) => i.status === 'Completed' || i.status === 'Signed Off');

  // Driven by engagement-level Dataverse flag or by all active issues having received completed management responses
  const hasBusinessResponses = Boolean(
    issues.some((i) => (i as any).businessResponseRequested === true) ||
    (activeEngagement as any)?.businessResponseRequested === true ||
    (activeIssues.length > 0 &&
      activeIssues.every(
        (i) =>
          i.businessResponseStatus === 'Completed' ||
          i.businessResponseStatus === 3 ||
          Boolean((i.businessManagementResponse || i.managementResponse || '').trim())
      ))
  );

  const readyIssuesCount = activeIssues.filter(
    (i) => i.status === 'Ready for Director Submission' || i.status === 'Manager Completed (Waiting for Other Issues)'
  ).length;

  const isPreDirectorStage = !allPendingDirector && !allPendingVP && !allCompleted;

  const callbackTargetIssue = issues.find((i) => i.id === callbackIssueId) || null;
  const sendToTargetIssue = issues.find((i) => i.id === sendToIssueId) || null;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: 'calc(100vh - var(--header-total-height, 71px))',
        backgroundColor: '#ffffff',
        overflow: 'hidden',
      }}
    >
      {/* Studio Header Toolbar */}
      <AuditReportHeaderToolbar
        onBack={() => setActiveReportingView('queue')}
        engagementTitle={
          (activeEngagement as any)?.fileName ||
          (activeEngagement as any)?.engagement ||
          selectedEngagementId ||
          'Audit Report'
        }
        isUnassignedAdmin={isUnassignedAdmin}
        isManager={isManager}
        isDirector={isDirector}
        isVP={isVP}
        isUserAdmin={isUserAdmin}
        isPreDirectorStage={isPreDirectorStage}
        allReadyForDirector={allReadyForDirector}
        allPendingDirector={allPendingDirector}
        allPendingVP={allPendingVP}
        allCompleted={allCompleted}
        hasBusinessResponses={hasBusinessResponses}
        hasCriticalFinding={hasCriticalFinding}
        readyIssuesCount={readyIssuesCount}
        totalActiveIssuesCount={activeIssues.length}
        onManagerSubmitToDirector={() => {
          if (allReadyForDirector) {
            handleManagerSubmitToDirector();
          } else {
            setToastMessage({
              message: `Cannot submit batch yet: Complete review on all issues at issue level first (${readyIssuesCount} of ${activeIssues.length} ready).`,
              severity: 'info',
            });
          }
        }}
        onOpenSubmitToDirectorRemarks={() => {
          if (allReadyForDirector) {
            setReportRemarksConfig({
              isOpen: true,
              title: 'Submit Audit Report to Audit Director',
              actionLabel: 'Submit to Director',
              currentStatus: 'Ready for Director Submission',
              targetStatus: 'Pending Director',
              actionType: 'submit-director',
            });
          } else {
            setToastMessage({
              message: `Cannot submit batch yet: Complete review on all issues at issue level first (${readyIssuesCount} of ${activeIssues.length} ready).`,
              severity: 'info',
            });
          }
        }}
        onDirectorSubmitToBusiness={() => handleDirectorSubmitToBusiness()}
        onOpenSubmitToBusinessRemarks={() =>
          setReportRemarksConfig({
            isOpen: true,
            title: 'Submit Findings to Business Management',
            actionLabel: 'Submit to Business',
            currentStatus: 'Pending Director',
            targetStatus: 'Pending Business',
            actionType: 'submit-business',
          })
        }
        onDirectorSubmitToVP={() => handleDirectorSubmitToVP()}
        onOpenSubmitToVPRemarks={() =>
          setReportRemarksConfig({
            isOpen: true,
            title: 'Submit Audit Report to Vice President',
            actionLabel: 'Submit to VP',
            currentStatus: 'Pending Director',
            targetStatus: 'Pending VP',
            actionType: 'submit-vp',
          })
        }
        onSignOffAuditReport={() => handleSignOffAuditReport()}
        onOpenSignOffRemarks={() =>
          setReportRemarksConfig({
            isOpen: true,
            title: isVP ? 'Executive Sign-Off & Seal (VP)' : 'Official Audit Report Sign-Off & Seal',
            actionLabel: 'Sign Off',
            currentStatus: isVP ? 'Pending VP' : 'Pending Director',
            targetStatus: 'Completed',
            actionType: 'sign-off',
          })
        }
        onDownloadReport={() => window.print()}
        onOpenExecutiveReport={() => setActiveReportingView('executive-studio')}
        onOpenWorkflowModal={() => {
          setWorkflowScope('report');
          setIsWorkflowModalOpen(true);
        }}
        onOpenAuditTrailLogs={() => {
          setLogsScope('report');
          setIsLogsOpen(true);
        }}
      />

      {/* Main Studio Body: 3-Pane Layout */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          overflow: 'hidden',
          position: 'relative',
          userSelect: isDraggingSplitter2 ? 'none' : 'auto',
          backgroundColor: '#F4F6F8',
        }}
      >
        {/* ============================================================== */}
        {/* PANE 1: Master Issue Cards List (Fixed 24%, Collapsible to 36px) */}
        {/* ============================================================== */}
        <div
          style={{
            flexGrow: isPane2Collapsed && isPane3Collapsed ? 1 : 0,
            flexShrink: 0,
            flexBasis: isPane1Collapsed
              ? '36px'
              : isPane2Collapsed && isPane3Collapsed
                ? 'auto'
                : `${pane1WidthPct}%`,
            width: isPane1Collapsed
              ? '36px'
              : isPane2Collapsed && isPane3Collapsed
                ? 'auto'
                : `${pane1WidthPct}%`,
            minWidth: isPane1Collapsed ? '36px' : '180px',
            maxWidth: isPane2Collapsed && isPane3Collapsed ? 'none' : `${pane1WidthPct}%`,
            height: '100%',
            overflow: 'hidden',
            backgroundColor: '#F4F6F8',
            boxShadow: '3px 0 10px rgba(0, 0, 0, 0.10)',
            zIndex: 10,
            position: 'relative',
          }}
        >
          <FindingNavigator
            issues={issues}
            selectedIssueId={selectedIssueId}
            onSelectIssue={setSelectedIssueId}
            onReorderIssues={handleReorderIssues}
            onOpenCreateDialog={() => {
              if (isUnassignedAdmin) {
                setToastMessage({
                  message: 'Administrator Oversight Mode (Read-Only): To add a finding, use "Impersonate User" to act on behalf of an assigned auditor.',
                  severity: 'info'
                });
                return;
              }
              setIsCreateOpen(true);
            }}
            onIncludeIssue={handleIncludeIssue}
            userRole={currentRole}
            isCollapsed={isPane1Collapsed}
            onToggleCollapse={setIsPane1Collapsed}
          />
        </div>

        {/* ============================================================== */}
        {/* PANE 2: Form Editor / Finding Workpaper Card                   */}
        {/* ============================================================== */}
        <div
          style={{
            flexGrow: isPane3Collapsed ? 1 : 0,
            flexShrink: isPane3Collapsed ? 1 : 0,
            flexBasis: isPane2Collapsed
              ? '36px'
              : isPane3Collapsed
                ? 'auto'
                : `${pane2Width}%`,
            width: isPane2Collapsed
              ? '36px'
              : isPane3Collapsed
                ? 'auto'
                : `${pane2Width}%`,
            minWidth: isPane2Collapsed ? '36px' : '220px',
            height: '100%',
            maxHeight: '100%',
            minHeight: 0,
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#ffffff',
            boxShadow: '2px 0 8px rgba(0, 0, 0, 0.05)',
            zIndex: 5,
            position: 'relative',
          }}
        >
          {selectedIssue ? (
            <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', height: '100%', maxHeight: '100%', overflow: 'hidden', backgroundColor: '#ffffff' }}>
              <FindingWorkpaperCard
                issue={selectedIssue}
                onUpdateIssue={handleUpdateIssue}
                onOpenAiCompare={() => setIsAiCompareOpen(true)}
                onOpenLogs={() => {
                  setLogsScope('issue');
                  setIsLogsOpen(true);
                }}
                onOpenWorkflow={() => {
                  setWorkflowScope('issue');
                  setIsWorkflowModalOpen(true);
                }}
                comments={comments}
                onAddComment={handleAddComment}
                onResolveComment={handleResolveComment}
                commentCounts={commentCounts}
                isAiSynthesizing={isAiSynthesizing}
                onTriggerAiSynthesis={handleTriggerAiSynthesis}
                canEdit={canEdit}
                editRestrictionReason={editRestrictionReason}
                onExcludeIssue={handleMarkExcludeIssue}
                onIncludeIssue={handleIncludeIssue}
                onToggleLock={handleToggleLock}
                onAcquireLock={handleAcquireLock}
                onOpenCallback={handleOpenCallback}
                onOpenSendTo={handleOpenSendTo}
                onMarkNotAnIssue={handleMarkNotAnIssue}
                isCollapsed={isPane2Collapsed}
                onToggleCollapse={setIsPane2Collapsed}
                currentUser={currentUser || undefined}
                assignedUsers={(activeEngagement as any)?.assignedUsers || []}
                isAdmin={effectiveIsAdmin}
                onAdvanceWorkflow={handleAdvanceWorkflow}
                userRole={currentRole}
                hasCriticalFinding={hasCriticalFinding}
                testProcedureOptions={testProcedureOptions}
                onSaveBusinessResponseOnBehalf={handleSaveBusinessResponseOnBehalf}
              />
            </div>
          ) : (
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#64748b' }}>
              No findings available in this engagement. Click &ldquo;Add Finding&rdquo; to create one.
            </div>
          )}
        </div>

        {/* SPLITTER 2 (between Pane 2 and Pane 3) */}
        {!isPane2Collapsed && !isPane3Collapsed && (
          <StudioPaneSplitter
            isDragging={isDraggingSplitter2}
            onMouseDown={(e) => {
              e.preventDefault();
              setIsDraggingSplitter2(true);
            }}
          />
        )}

        {/* ============================================================== */}
        {/* PANE 3: Live HTML PDF-Style Report Preview                      */}
        {/* ============================================================== */}
        <div
          style={{
            flexGrow: isPane3Collapsed ? 0 : 1,
            flexShrink: isPane3Collapsed ? 0 : 1,
            flexBasis: isPane3Collapsed ? '36px' : 'auto',
            width: isPane3Collapsed ? '36px' : 'auto',
            minWidth: isPane3Collapsed ? '36px' : '280px',
            maxWidth: isPane3Collapsed ? '36px' : 'none',
            height: '100%',
            overflow: 'hidden',
            backgroundColor: '#E8EDF2',
          }}
        >
          <AuditReportPreviewPane
            issues={issues}
            selectedIssue={selectedIssue}
            isCollapsed={isPane3Collapsed}
            onToggleCollapse={setIsPane3Collapsed}
            onIncludeIssue={handleIncludeIssue}
            engagementFileName={
              (activeEngagement as any)?.fileName ||
              (activeEngagement as any)?.engagement ||
              'Audit Report'
            }
            auditableEntityName={
              (activeEngagement as any)?.auditableEntity ||
              (activeEngagement as any)?.plantLocation ||
              'GA&A Internal Audit'
            }
          />
        </div>
      </div>

      {/* Studio Dialogs & Modals Container */}
      <StudioDialogContainer
        isWorkflowModalOpen={isWorkflowModalOpen}
        onCloseWorkflowModal={() => setIsWorkflowModalOpen(false)}
        workflowScope={workflowScope}
        activeEngagement={activeEngagement}
        selectedIssue={selectedIssue}
        issues={issues}
        isAiCompareOpen={isAiCompareOpen}
        onCloseAiCompare={() => setIsAiCompareOpen(false)}
        onApplyAiMerge={handleApplyAiMerge}
        isCreateOpen={isCreateOpen}
        onCloseCreate={() => setIsCreateOpen(false)}
        selectedEngagementId={selectedEngagementId}
        currentRole={currentRole}
        currentUser={currentUser}
        onCreateNewIssue={handleCreateNewIssue}
        isLogsOpen={isLogsOpen}
        onCloseLogs={() => setIsLogsOpen(false)}
        logsScope={logsScope}
        auditLogs={auditLogs}
        isCallbackModalOpen={isCallbackModalOpen}
        onCloseCallback={() => setIsCallbackModalOpen(false)}
        callbackTargetIssue={callbackTargetIssue}
        onConfirmCallback={handleConfirmCallback}
        isSendToModalOpen={isSendToModalOpen}
        onCloseSendTo={() => setIsSendToModalOpen(false)}
        sendToTargetIssue={sendToTargetIssue}
        onConfirmSendTo={handleConfirmSendTo}
        isExcludeModalOpen={isExcludeModalOpen}
        onCloseExclude={() => {
          setIsExcludeModalOpen(false);
          setIssueToExclude(null);
        }}
        issueToExclude={issueToExclude}
        onConfirmExclude={handleConfirmExclude}
        isWarningOpen={isWarningOpen}
        secondsRemaining={secondsRemaining}
        onKeepWorking={handleKeepWorking}
        onManualUnlock={handleManualUnlock}
        reportRemarksConfig={reportRemarksConfig}
        onCloseReportRemarks={() => setReportRemarksConfig(null)}
        onConfirmReportRemarks={async (remarks) => {
          if (!reportRemarksConfig) return;
          if (reportRemarksConfig.actionType === 'submit-director') {
            await handleManagerSubmitToDirector(remarks);
          } else if (reportRemarksConfig.actionType === 'submit-business') {
            await handleDirectorSubmitToBusiness(remarks);
          } else if (reportRemarksConfig.actionType === 'submit-vp') {
            await handleDirectorSubmitToVP(remarks);
          } else if (reportRemarksConfig.actionType === 'sign-off') {
            await handleSignOffAuditReport(remarks);
          }
        }}
      />


      {/* Toast Feedback Notification (Componentised & Positioned Top-Right Underneath Global Header) */}
      <SharedToast
        open={!!toastMessage}
        onClose={() => setToastMessage(null)}
        title={toastMessage?.title}
        message={toastMessage?.message}
        severity={toastMessage?.severity}
        position="top-right"
        duration={4000}
      />
    </div>
  );
};
