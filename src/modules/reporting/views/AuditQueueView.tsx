import React, { useState, useEffect, useMemo } from 'react';
import {
  RotateCcw,
  Filter,
  ArrowUpDown,
  Calendar,
  RefreshCw
} from 'lucide-react';
import { useEngagement } from '../../../context/EngagementContext';
import { useUserSession } from '../../../context/UserSessionContext';
import {
  getEngagementWorkflowState,
  isAuditNeedingAction,
  isUserAssignedToEngagement,
  getUserRoleOnEngagement,
  getRoleDetails,
} from '../utils/reportingWorkflowEngine';
import { fetchDataverseReportingData, createDataverseIssue } from '../../../services/dataverseReportingService';
import { CreateIssueDialog } from '../components/CreateIssueDialog';
import { AuditQueueCardRow } from '../components/AuditQueueCardRow';
import { CreateSummaryConfirmModal } from '../components/CreateSummaryConfirmModal';
import {
  SharedTabs,
  type SharedTabItem,
  SharedFilterSelect,
  type FilterOption,
  SharedSearchInput,
  SharedTooltip,
  SharedButton,
  PageHeader,
  SharedToast,
  SharedAuditQueueSkeleton,
  type ToastSeverity
} from '../../../components/shared';

const STATUS_OPTIONS = [
  { id: 'Not Started', label: 'Not Started', color: '#64748B', bg: '#F8FAFC', border: '#E2E8F0' },
  { id: 'Audit Report Inprogress', label: 'Audit Report Inprogress', color: '#000099', bg: '#EFF6FF', border: '#BFDBFE' },
  { id: 'Executive Report Inprogress', label: 'Executive Report Inprogress', color: '#B45309', bg: '#FEF3C7', border: '#FDE68A' },
  { id: 'Completed', label: 'Completed', color: '#087D0D', bg: '#F0FDF4', border: '#BBF2D0' }
];

export const AuditQueueView: React.FC = () => {
  const { setSelectedEngagementId, setActiveReportingView, setActiveEngagement } = useEngagement();
  const { currentUser, activeRole, isAdmin, isImpersonating } = useUserSession();
  const userRole =
    activeRole?.id && activeRole.id !== 'assigned'
      ? activeRole.id
      : currentUser?.role && currentUser.role !== 'Global Audit Administrator'
      ? currentUser.role
      : 'it-manager';
  const userRoleDetails = useMemo(() => getRoleDetails(userRole), [userRole]);
  const isBusinessRole = userRoleDetails.baseRole === 'primary-business-contact';

  const [jobs, setJobs] = useState<any[]>([]);
  const [assessmentsList, setAssessmentsList] = useState<any[]>([]);
  const [isLiveConnected, setIsLiveConnected] = useState<boolean>(false);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [isInitialLoading, setIsInitialLoading] = useState<boolean>(true);
  const [auditTab, setAuditTab] = useState<'my-actions' | 'all-associated'>('my-actions');

  // Load Dataverse tables on mount and when manually refreshed
  const loadLiveReportingData = async (showToast = false) => {
    setIsRefreshing(true);
    try {
      const payload = await fetchDataverseReportingData();
      setJobs(payload.jobs);
      setAssessmentsList(payload.assessments);
      setIsLiveConnected(payload.isLiveConnected);
      if (showToast) {
        setToastMessage({
          title: payload.isLiveConnected ? 'Connected to Dataverse' : 'Dataverse Disconnected',
          description: payload.isLiveConnected
            ? `Successfully synchronized ${payload.jobs.length} engagements from Microsoft Dataverse.`
            : 'Power Apps host session not detected or tables empty.',
          severity: payload.isLiveConnected ? 'success' : 'info'
        });
      }
    } catch (err) {
      console.warn('[AuditQueueView] Dataverse fetch error:', err);
    } finally {
      setIsRefreshing(false);
      setIsInitialLoading(false);
    }
  };

  useEffect(() => {
    loadLiveReportingData(false);
  }, []);

  // Filter Toolbar States (Driven by Shared Components)
  const [selectedAssessments, setSelectedAssessments] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Enterprise full portfolio access when Admin is NOT impersonating another user
  const hasFullPortfolioAccess = isAdmin && !isImpersonating;

  // 1. Engagements visible to this user / persona (Admin has all; standard user has assigned only)
  const userAssociatedJobs = useMemo(() => {
    if (hasFullPortfolioAccess) {
      return jobs;
    }
    return jobs.filter((job) =>
      isUserAssignedToEngagement(job, currentUser.email, currentUser.userId)
    );
  }, [jobs, hasFullPortfolioAccess, currentUser.email, currentUser.userId]);

  // 2. Engagements requiring action for this user / persona
  const userActionJobs = useMemo(() => {
    return userAssociatedJobs.filter((job) => {
      if (isBusinessRole) {
        return (
          (job.issuesList || []).some((iss: any) => (iss.status || '').toLowerCase().includes('business')) ||
          (job.status || '').toLowerCase().includes('business') ||
          (job.subStatus || '').toLowerCase().includes('business')
        );
      }
      // Check user's assigned role on this specific engagement, or use active role
      const roleOnEng = getUserRoleOnEngagement(job, currentUser.email, currentUser.userId) || userRole;
      return isAuditNeedingAction(job, roleOnEng);
    });
  }, [userAssociatedJobs, isBusinessRole, currentUser.email, currentUser.userId, userRole]);

  // Memoized filter options for SharedFilterSelect (Loads portfolio assessment years)
  const assessmentOptions: FilterOption[] = useMemo(() => {
    return assessmentsList.map((asm: any) => {
      const asmYear = String(asm.year || asm.name?.match(/20\d{2}/)?.[0] || '');
      const asmId = asm.id;
      const normAsmId = asmId ? String(asmId).toLowerCase().replace(/[{}]/g, '').trim() : '';

      const asmCount = userAssociatedJobs.filter((j) => {
        const jAsmId = j.assessmentId ? String(j.assessmentId).toLowerCase().replace(/[{}]/g, '').trim() : '';
        if (normAsmId && jAsmId && jAsmId === normAsmId) return true;
        const jYear = String(j.year || j.assessmentYear || '');
        if (asmYear && jYear && asmYear === jYear) return true;
        return false;
      }).length;

      const isClosed = asm.status === 'Closed' || asm.status === 'Finalized';
      return {
        value: asm.id,
        label: asmYear || String(asm.name),
        count: asmCount,
        tag: asm.status,
        tagColor: isClosed
          ? { bg: '#F1F5F9', text: '#475569', border: '#CBD5E1' }
          : { bg: '#ECFDF5', text: '#087D0D', border: '#A7F3D0' }
      };
    });
  }, [userAssociatedJobs, assessmentsList]);

  const statusOptions: FilterOption[] = useMemo(() => {
    return STATUS_OPTIONS.map((opt) => {
      const optCount = userAssociatedJobs.filter((j) => getEngagementWorkflowState(j).status === opt.id).length;
      return {
        value: opt.id,
        label: opt.label,
        count: optCount,
        tagColor: { bg: opt.bg, text: opt.color, border: opt.border }
      };
    });
  }, [userAssociatedJobs]);

  // Workbench & Expansion States
  const [expandedRowId, setExpandedRowId] = useState<string | null>(null);
  const [expandedInnerTabs, setExpandedInnerTabs] = useState<Record<string, string>>({});

  // Sorting State
  const [sortField, setSortField] = useState<string>('lastUpdated');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Drawer & Dialog States
  const [isCreateDrawerOpen, setIsCreateDrawerOpen] = useState(false);
  const [selectedJobForIssue, setSelectedJobForIssue] = useState<any | null>(null);
  const [confirmSummaryJob, setConfirmSummaryJob] = useState<any | null>(null);
  const [sendToDropdownIssueId, setSendToDropdownIssueId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{
    title: string;
    description: string;
    severity?: ToastSeverity;
  } | null>(null);

  // Close custom issue action dropdown on click outside
  useEffect(() => {
    function handleClickOutside() {
      setSendToDropdownIssueId(null);
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Navigation handlers
  const handleWorkOnReport = (job: any, type: 'audit' | 'executive') => {
    if (type === 'executive') {
      const activeIssuesCount = Array.isArray(job.issuesList)
        ? job.issuesList.filter((iss: any) => iss.status !== 'Excluded' && iss.status !== 822500009).length
        : 0;
      const isNotStarted =
        job.status === 'Not Started' ||
        job.workflowStatus === 'Not Started' ||
        job.subStatus === 'Not Started';

      if (activeIssuesCount === 0 && isNotStarted) {
        setConfirmSummaryJob(job);
        return;
      }
    }

    setSelectedEngagementId(job.id);
    setActiveEngagement(job);
    setActiveReportingView(type === 'audit' ? 'audit-studio' : 'executive-studio');
  };

  const handleConfirmCreateSummary = () => {
    if (!confirmSummaryJob) return;
    const targetJob = confirmSummaryJob;
    setConfirmSummaryJob(null);
    setSelectedEngagementId(targetJob.id);
    setActiveEngagement(targetJob);
    setActiveReportingView('executive-studio');
  };

  const handleOpenCreateForJob = (job: any) => {
    setSelectedJobForIssue(job);
    setIsCreateDrawerOpen(true);
  };

  const handleSaveNewIssue = async (newIssueData: any, statusAction?: 'draft' | 'submit') => {
    if (selectedJobForIssue) {
      try {
        const created = await createDataverseIssue(
          {
            engagementId: selectedJobForIssue.id,
            ...newIssueData
          },
          currentUser,
          selectedJobForIssue.assignedUsers || []
        );

        const newIssue = created?.issue || {
          id: created?.iar_issuesid || `ISSUE-${Date.now().toString().slice(-4)}`,
          title: newIssueData.title || 'New Finding',
          header: newIssueData.title || 'New Finding',
          criticality: newIssueData.criticality || 'Major',
          status: newIssueData.status || (statusAction === 'submit' ? 'Pending TC' : 'Pending Staff'),
          currentLevel: newIssueData.status || (statusAction === 'submit' ? 'Pending TC' : 'Pending Staff'),
          createdBy: currentUser?.name || activeRole?.label || 'Auditor',
          lastEditedBy: currentUser?.name || activeRole?.label || 'Auditor',
          lastUpdated: new Date().toISOString().split('T')[0],
          tech: activeRole?.domain || newIssueData.function || 'IT',
          ...newIssueData
        };

        setJobs(prev =>
          prev.map(j => {
            if (j.id === selectedJobForIssue.id) {
              const updatedIssues = [...(j.issuesList || []), newIssue];
              return {
                ...j,
                status: j.status === 'Not Started' ? 'In Progress' : j.status,
                subStatus: 'Audit Report In Progress',
                workflowStatus: 'Audit Report In Progress',
                issuesList: updatedIssues
              };
            }
            return j;
          })
        );

        const isSubmitted = statusAction === 'submit' || (newIssue.status && !newIssue.status.includes('Draft') && !newIssue.status.includes('Staff'));
        setToastMessage({
          title: isSubmitted ? 'Issue Submitted to Review' : 'Issue Saved as Draft',
          description: isSubmitted
            ? `Issue "${newIssue.title}" submitted to review for ${selectedJobForIssue.id}.`
            : `New draft issue "${newIssue.title}" saved in ${selectedJobForIssue.id}.`,
          severity: 'success'
        });

        // Background sync to ensure exact state alignment
        loadLiveReportingData(false).catch(() => {});
      } catch (err: any) {
        console.error('[AuditQueueView] Error saving issue to Dataverse:', err);
        setToastMessage({
          title: 'Error Saving Issue',
          description: err?.message || 'Could not persist issue to Dataverse.',
          severity: 'error'
        });
      }
    }
    setIsCreateDrawerOpen(false);
    setSelectedJobForIssue(null);
  };

  const handleSendToRole = (jobId: string, issueId: string, targetStageObj: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setJobs(prev =>
      prev.map(j => {
        if (j.id === jobId) {
          return {
            ...j,
            status: 'In Progress',
            issuesList: (j.issuesList || []).map((iss: any) =>
              iss.id === issueId
                ? {
                    ...iss,
                    currentLevel: targetStageObj.id,
                    status: targetStageObj.id === 'VP Sign-Off' ? 'Completed' : 'In Review'
                  }
                : iss
            )
          };
        }
        return j;
      })
    );
    setToastMessage({
      title: `Issue Sent to ${targetStageObj.role}`,
      description: `Issue current stage updated to ${targetStageObj.label}.`
    });
    setSendToDropdownIssueId(null);
  };

  // Dynamic Badges counts for Primary Tabs
  const myActionAuditsCount = userActionJobs.length;
  const allAssociatedAuditsCount = userAssociatedJobs.length;

  const primaryTabItems: SharedTabItem<'my-actions' | 'all-associated'>[] = useMemo(() => [
    {
      id: 'my-actions',
      label: 'My Action Audits',
      count: myActionAuditsCount
    },
    {
      id: 'all-associated',
      label: 'All Associated',
      count: allAssociatedAuditsCount
    }
  ], [myActionAuditsCount, allAssociatedAuditsCount]);

  // Filtering Logic
  const filteredJobs = useMemo(() => {
    const baseList = auditTab === 'my-actions' ? userActionJobs : userAssociatedJobs;

    return baseList
      .filter(job => {
        // Assessment Filter (Multi-Select & Single-Select)
        if (selectedAssessments.length > 0) {
          const isMatch = selectedAssessments.some((selectedVal) => {
            const normSelected = String(selectedVal).toLowerCase().replace(/[{}]/g, '').trim();

            // 1. Direct match on job.assessmentId GUID or ID
            const jAsmId = job.assessmentId ? String(job.assessmentId).toLowerCase().replace(/[{}]/g, '').trim() : '';
            if (jAsmId && (jAsmId === normSelected || jAsmId === selectedVal)) return true;

            // 2. Direct match on job.year or job.assessmentYear
            const jobYear = String(job.year || job.assessmentYear || '');
            if (jobYear && (jobYear === selectedVal || jobYear === normSelected)) return true;

            // 3. Match against assessmentsList record
            const selectedAsm = assessmentsList.find((a: any) => {
              const aId = a.id ? String(a.id).toLowerCase().replace(/[{}]/g, '').trim() : '';
              return aId === normSelected || a.id === selectedVal || a.year === selectedVal || a.name === selectedVal;
            });
            if (selectedAsm) {
              const selectedYear = String(selectedAsm.year || selectedAsm.name?.match(/20\d{2}/)?.[0] || '');
              if (selectedYear && jobYear && selectedYear === jobYear) return true;
              const selAsmId = selectedAsm.id ? String(selectedAsm.id).toLowerCase().replace(/[{}]/g, '').trim() : '';
              if (jAsmId && selAsmId && jAsmId === selAsmId) return true;
            }

            return false;
          });
          if (!isMatch) return false;
        }

        // Status Filter
        if (selectedStatuses.length > 0) {
          const wfState = getEngagementWorkflowState(job);
          if (!selectedStatuses.includes(wfState.status)) return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const wfState = getEngagementWorkflowState(job);
          const match =
            job.id.toLowerCase().includes(q) ||
            (job.engagement && job.engagement.toLowerCase().includes(q)) ||
            (job.fileName && job.fileName.toLowerCase().includes(q)) ||
            wfState.status.toLowerCase().includes(q) ||
            wfState.queue.toLowerCase().includes(q) ||
            wfState.ownerText.toLowerCase().includes(q) ||
            (job.assessmentName && job.assessmentName.toLowerCase().includes(q));
          if (!match) return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortField === 'lastUpdated') {
          const dateA = new Date((a.lastUpdated || '').replace(' ', 'T')).getTime() || 0;
          const dateB = new Date((b.lastUpdated || '').replace(' ', 'T')).getTime() || 0;
          return sortAsc ? dateA - dateB : dateB - dateA;
        }
        let valA: string, valB: string;
        if (sortField === 'engagement') {
          valA = a.fileName || a.engagement || '';
          valB = b.fileName || b.engagement || '';
        } else if (sortField === 'status' || sortField === 'subStatus') {
          valA = getEngagementWorkflowState(a).status;
          valB = getEngagementWorkflowState(b).status;
        } else if (sortField === 'currentQueue') {
          valA = getEngagementWorkflowState(a).queue;
          valB = getEngagementWorkflowState(b).queue;
        } else if (sortField === 'currentOwner') {
          valA = getEngagementWorkflowState(a).ownerText;
          valB = getEngagementWorkflowState(b).ownerText;
        } else {
          valA = (a[sortField] || '').toString();
          valB = (b[sortField] || '').toString();
        }
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
        if (valA < valB) return sortAsc ? -1 : 1;
        if (valA > valB) return sortAsc ? 1 : -1;
        return 0;
      });
  }, [
    userActionJobs,
    userAssociatedJobs,
    selectedAssessments,
    auditTab,
    selectedStatuses,
    searchQuery,
    sortField,
    sortAsc
  ]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(true);
    }
  };

  const handleClearFilters = () => {
    setSelectedStatuses([]);
    setSelectedAssessments([]);
    setSearchQuery('');
  };

  const isFilterActive =
    selectedStatuses.length > 0 || searchQuery.trim() !== '' || selectedAssessments.length > 0;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: '100%',
        minHeight: '100%',
        flex: 1,
        backgroundColor: '#ffffff',
      }}
    >
      {/* Toast Feedback Notification (Componentised & Positioned Top-Right Underneath Global Header) */}
      <SharedToast
        open={!!toastMessage}
        onClose={() => setToastMessage(null)}
        title={toastMessage?.title}
        description={toastMessage?.description}
        severity={toastMessage?.severity || 'success'}
        position="top-right"
        duration={4500}
      />

      {/* Standardized PageHeader Action Toolbar with Primary Tab Selector */}
      <PageHeader
        tabs={
          <SharedTabs<'my-actions' | 'all-associated'>
            items={primaryTabItems}
            value={auditTab}
            onChange={(newTab) => setAuditTab(newTab)}
            ariaLabel="Audit Queue primary tabs"
            hasBottomBorder={false}
            marginBottom={0}
          />
        }
      />

      <div
        className="full-width-queue"
        style={{
          position: 'relative',
          width: '100%',
          paddingTop: 'var(--space-filter-margin-bottom, 16px)',
        }}
      >

      {/* Single-Row Filter Toolbar (Using Shared Components - Spanning Full Width) */}
      <div
        className="single-row-filter-panel"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          width: '100%',
          marginBottom: '22px',
          minHeight: 'var(--control-min-height-sm, 2.25rem)',
          flexWrap: 'wrap',
        }}
      >
          {/* 1. Search Engagements Input (Expands to occupy remaining width) */}
          <div style={{ flex: '1 1 auto', minWidth: '280px' }}>
            <SharedSearchInput
              value={searchQuery}
              onChange={(val) => setSearchQuery(val)}
              placeholder="Search Job ID, engagement..."
              size="small"
              clearable
              showDropdownArrow={false}
              fullWidth
            />
          </div>

          {/* 2. Status Multi-Select Filter (minWidth set to stably fit 'Executive Report Inprogress' without expanding) */}
          <SharedFilterSelect
            label="Status"
            placeholder="All Statuses"
            allOptionLabel="All Statuses"
            startIcon={<Filter size={13} />}
            options={statusOptions}
            value={selectedStatuses}
            onChange={(newVal) => setSelectedStatuses(newVal)}
            totalCount={jobs.length}
            minWidth={275}
            menuWidth={290}
          />

          {/* 3. Assessment Year Multi-Select Filter (Loads only years: 2024, 2025, 2026, 2027) */}
          <SharedFilterSelect
            label="Assessment Year"
            placeholder="All Assessment Years"
            allOptionLabel="All Assessment Years"
            startIcon={<Calendar size={13} />}
            options={assessmentOptions}
            value={selectedAssessments}
            onChange={(newVal) => setSelectedAssessments(newVal)}
            totalCount={jobs.length}
            minWidth={210}
            menuWidth={240}
          />

          {/* Always-present Clear Filters Icon Button with Componentized Tooltip */}
          <SharedTooltip
            title="Clear filters"
            placement="top"
          >
            <SharedButton
              variant="outline"
              size="small"
              onClick={handleClearFilters}
              disabled={!isFilterActive}
              aria-label="Clear filters"
              style={{
                width: 'var(--control-min-height-sm, 2.25rem)',
                height: 'var(--control-min-height-sm, 2.25rem)',
                minWidth: 'var(--control-min-height-sm, 2.25rem)',
                minHeight: 'var(--control-min-height-sm, 2.25rem)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: isFilterActive ? '#EFF6FF' : '#F8FAFC',
                borderColor: isFilterActive ? '#BFDBFE' : '#E2E8F0',
                borderRadius: '4px',
                padding: 0,
                flexShrink: 0,
              }}
            >
              <RotateCcw
                size={15}
                color={isFilterActive ? '#000099' : '#94A3B8'}
                strokeWidth={2.2}
              />
            </SharedButton>
          </SharedTooltip>

          {/* Refresh Dataverse Data Button */}
          <SharedTooltip
            title="Refresh Data from Dataverse"
            placement="top"
          >
            <SharedButton
              variant="outline"
              size="small"
              onClick={() => loadLiveReportingData(true)}
              aria-label="Refresh Data from Dataverse"
              style={{
                width: 'var(--control-min-height-sm, 2.25rem)',
                height: 'var(--control-min-height-sm, 2.25rem)',
                minWidth: 'var(--control-min-height-sm, 2.25rem)',
                minHeight: 'var(--control-min-height-sm, 2.25rem)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#F8FAFC',
                borderColor: '#E2E8F0',
                borderRadius: '4px',
                padding: 0,
                flexShrink: 0,
              }}
            >
              <RefreshCw
                size={14}
                color="#000099"
                strokeWidth={2.2}
                style={{
                  animation: isRefreshing ? 'spin 1s linear infinite' : 'none'
                }}
              />
            </SharedButton>
          </SharedTooltip>
        </div>

      {/* Queue Table Layout with Header Grid & Expandable Cards */}
      <div className="audit-queue-scroll-container">
        <div className="audit-queue-table-layout">
          {/* Header Grid (Aligned with Card Summaries - Transparent background, no heavy borders) */}
          <div className={`audit-queue-header-grid ${auditTab === 'my-actions' ? 'my-actions-layout' : 'all-associated-layout'}`}>
            {/* Column 1: Expand Spacer */}
            <div style={{ width: '44px', textAlign: 'center' }}></div>

            {/* Column 2: Engagement */}
            <div
              className="audit-queue-header-col sortable"
              onClick={() => handleSort('engagement')}
            >
              <span>Engagement</span>
              <ArrowUpDown size={12} className="th-sort-icon" />
            </div>

            {/* Column 3: Engagement Status */}
            <div
              className="audit-queue-header-col sortable"
              onClick={() => handleSort('status')}
            >
              <span>Status</span>
              <ArrowUpDown size={12} className="th-sort-icon" />
            </div>

            {/* When My Action Audits: Action Issues is placed right next to Status (clean text, no tooltip) */}
            {auditTab === 'my-actions' && (
              <div className="audit-queue-header-col center">
                <span>Action Issues</span>
              </div>
            )}

            {/* Current Queue */}
            <div
              className="audit-queue-header-col sortable"
              onClick={() => handleSort('currentQueue')}
            >
              <span>Current Queue</span>
              <ArrowUpDown size={12} className="th-sort-icon" />
            </div>

            {/* Current Owner */}
            <div
              className="audit-queue-header-col sortable"
              onClick={() => handleSort('currentOwner')}
            >
              <span>Current Owner</span>
              <ArrowUpDown size={12} className="th-sort-icon" />
            </div>

            {/* When All Associated Audits: Keep only In-Progress column in primary row (Center Aligned) */}
            {auditTab === 'all-associated' && (
              <div className="audit-queue-header-col center">
                <span>In-Progress</span>
              </div>
            )}

            {/* Column: Actions */}
            <div className="audit-queue-header-col right">
              <span>Actions</span>
            </div>
          </div>

          {/* Cards List, Loading Skeleton, or Empty State */}
          {isInitialLoading || (isRefreshing && jobs.length === 0) ? (
            <SharedAuditQueueSkeleton rows={6} auditTab={auditTab} />
          ) : filteredJobs.length === 0 ? (
            <div
              style={{
                padding: '48px',
                textAlign: 'center',
                backgroundColor: '#ffffff',
                borderRadius: '8px',
                border: '1px solid #edf0f5',
                boxShadow: '0 1px 3px rgba(0, 0, 0, 0.04)',
                color: '#64748B'
              }}
            >
              <Filter size={36} color="#CBD5E1" style={{ margin: '0 auto 8px' }} />
              <p style={{ fontWeight: 700, color: '#334155', margin: 0 }}>
                {jobs.length === 0 && isLiveConnected
                  ? 'No audit engagements found in Microsoft Dataverse'
                  : auditTab === 'my-actions'
                  ? 'No audits currently requiring your action'
                  : 'No reporting jobs matched your filters'}
              </p>
              {auditTab !== 'my-actions' && (
                <p style={{ fontSize: '11px', color: '#94A3B8', marginTop: '6px' }}>
                  {jobs.length === 0 && isLiveConnected
                    ? 'The app is successfully connected to your Dataverse environment, but table iar_engagementses currently has 0 records. Synchronize from TeamMate or create an engagement to see records here.'
                    : isImpersonating
                    ? `${currentUser.name} (${currentUser.email}) has no assigned audits in this portfolio matching your filters.`
                    : 'Try clearing your search query or status filters.'}
                </p>
              )}
              {auditTab === 'my-actions' && allAssociatedAuditsCount > 0 && (
                <button
                  type="button"
                  onClick={() => setAuditTab('all-associated')}
                  style={{
                    marginTop: '14px',
                    padding: '6px 14px',
                    backgroundColor: '#ffffff',
                    border: '1px solid #CBD5E1',
                    borderRadius: '6px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#000099',
                    cursor: 'pointer'
                  }}
                >
                  Switch to All Associated Audits ({allAssociatedAuditsCount})
                </button>
              )}
            </div>
          ) : (
            filteredJobs.map((job) => (
              <AuditQueueCardRow
                key={job.id}
                job={job}
                userRole={getUserRoleOnEngagement(job, currentUser.email, currentUser.userId) || userRole}
                isBusinessRole={isBusinessRole}
                auditTab={auditTab}
                isExpanded={expandedRowId === job.id}
                onToggleExpand={() => setExpandedRowId((prev) => (prev === job.id ? null : job.id))}
                expandedInnerTab={expandedInnerTabs[job.id] || 'all'}
                onChangeInnerTab={(tabId) => setExpandedInnerTabs((prev) => ({ ...prev, [job.id]: tabId }))}
                sendToDropdownIssueId={sendToDropdownIssueId}
                setSendToDropdownIssueId={setSendToDropdownIssueId}
                onWorkOnReport={handleWorkOnReport}
                onOpenCreateForJob={handleOpenCreateForJob}
                onSendToRole={handleSendToRole}
              />
            ))
          )}
        </div>
      </div>

      {/* Create Issue Dialog */}
      {isCreateDrawerOpen && selectedJobForIssue && (
        <CreateIssueDialog
          open={isCreateDrawerOpen}
          onClose={() => setIsCreateDrawerOpen(false)}
          engagementId={selectedJobForIssue.id}
          job={selectedJobForIssue}
          engagementName={selectedJobForIssue.title || selectedJobForIssue.engagementName || selectedJobForIssue.name}
          userRole={
            activeRole?.id && activeRole.id !== 'assigned'
              ? activeRole.id
              : getUserRoleOnEngagement(selectedJobForIssue, currentUser.email, currentUser.userId) ||
                userRole
          }
          currentUser={currentUser}
          onSave={handleSaveNewIssue}
        />
      )}

      {/* Confirmation Modal for Starting Summary Report Without Issues */}
      <CreateSummaryConfirmModal
        isOpen={Boolean(confirmSummaryJob)}
        onClose={() => setConfirmSummaryJob(null)}
        onConfirm={handleConfirmCreateSummary}
        engagementName={
          confirmSummaryJob?.fileName ||
          confirmSummaryJob?.engagementName ||
          confirmSummaryJob?.engagement ||
          confirmSummaryJob?.title ||
          confirmSummaryJob?.id ||
          'Audit Engagement'
        }
      />
      </div>
    </div>
  );
};
