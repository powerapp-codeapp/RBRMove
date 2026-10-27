import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Plus,
  Minus,
  Download,
  Send,
  GitBranch,
  History,
  Sparkles,
  CheckCircle2,
  FileText,
  ZoomIn,
  ZoomOut,
  Printer,
  X,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  MessageSquare,
} from 'lucide-react';
import { useEngagement } from '../../../context/EngagementContext';
import { useUserSession } from '../../../context/UserSessionContext';
import { generateExecutiveSummaryData, type ExecutiveSummaryData } from '../utils/execReportData';
import { getUserRoleOnEngagement } from '../utils/reportingWorkflowEngine';
import {
  PageHeader,
  SharedSelectButton,
  SharedTextInput,
  SharedTextArea,
  SharedFieldLabel,
  SharedButton,
  SharedToast,
} from '../../../components/shared';
import { WorkflowModal } from '../components/WorkflowModal';
import { IssueLogsDialog } from '../components/IssueLogsDialog';
import { FieldCommentPopover, type CommentUser } from '../components/FieldCommentPopover';
import type { IssueComment, AuditTrailLog } from '../../../types/dataverse.types';

export const ExecutiveStudioView: React.FC = () => {
  const { selectedEngagementId, setActiveReportingView, activeEngagement } = useEngagement();
  const { activeRole, currentUser } = useUserSession();

  // Dynamically resolve user's role on this active engagement (FRD Section 2.3)
  const userRole = useMemo(() => {
    if (activeEngagement) {
      const assignedRole = getUserRoleOnEngagement(activeEngagement, currentUser.email, currentUser.userId);
      if (assignedRole) return assignedRole;
    }
    return activeRole?.id || 'it-manager';
  }, [activeEngagement, currentUser.email, currentUser.userId, activeRole?.id]);

  const [execData, setExecData] = useState<ExecutiveSummaryData>(() =>
    generateExecutiveSummaryData(activeEngagement || { id: selectedEngagementId || 'REP-2026-881' })
  );

  useEffect(() => {
    if (activeEngagement) {
      setExecData(generateExecutiveSummaryData(activeEngagement));
    }
  }, [activeEngagement?.id]);

  // Section Accordion State
  const [expandedSection, setExpandedSection] = useState<'scope' | 'insights' | 'issues' | null>('scope');

  // Resizable Splitter State (Default: 55% Pane 1, 45% Pane 2)
  const [leftWidth, setLeftWidth] = useState<number>(55);
  const [isLeftCollapsed, setIsLeftCollapsed] = useState<boolean>(false);
  const [isRightCollapsed, setIsRightCollapsed] = useState<boolean>(false);
  const [isDraggingSplitter, setIsDraggingSplitter] = useState<boolean>(false);
  const [isHoveredSplitter, setIsHoveredSplitter] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Zoom & Preview State
  const [previewZoom, setPreviewZoom] = useState<number>(100);

  // Dialog States
  const [isWorkflowModalOpen, setIsWorkflowModalOpen] = useState(false);
  const [isLogsModalOpen, setIsLogsModalOpen] = useState(false);

  // Field Level & Row Level Comments State
  const [activeCommentField, setActiveCommentField] = useState<string | null>(null);
  const [popoverPlacement, setPopoverPlacement] = useState<'up' | 'down'>('down');
  const [comments, setComments] = useState<IssueComment[]>([
    {
      commentId: 'COMM-EXEC-01',
      issueId: 'EXEC-2026-881',
      fieldKey: 'scope_assessmentPeriod',
      content: 'Please verify if the Suzhou plant review period includes Q2 financial close.',
      authorId: 'USR-002',
      authorName: 'Sarah Jenkins',
      isResolved: false,
      createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
      taggedUserName: currentUser?.name || 'Current Auditor',
      taggedUserId: currentUser?.userId || 'USR-001',
    },
    {
      commentId: 'COMM-EXEC-02',
      issueId: 'EXEC-2026-881',
      fieldKey: 'processMatrix_row_0',
      content: 'Confirmed Costar lease discrepancies with regional finance controller.',
      authorId: 'USR-003',
      authorName: 'Brian Cox',
      isResolved: true,
      resolvedByName: currentUser?.name || 'Current Auditor',
      resolvedById: currentUser?.userId || 'USR-001',
      createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
    },
  ]);

  const [auditLogs, setAuditLogs] = useState<AuditTrailLog[]>([]);

  const [toastMessage, setToastMessage] = useState<{
    title?: string;
    message: string;
    severity: 'success' | 'info' | 'warning' | 'error';
  } | null>(null);

  // Available users for tagging in comments
  const availableUsers: CommentUser[] = useMemo(
    () => [
      { userId: 'USR-001', name: currentUser?.name || 'Current Auditor', role: activeRole?.label || 'Auditor', avatar: 'CA', avatarBg: '#000099' },
      { userId: 'USR-002', name: 'Sarah Jenkins', role: 'IT Audit Manager', avatar: 'SJ', avatarBg: '#eb1700' },
      { userId: 'USR-003', name: 'Brian Cox', role: 'IT Audit Director', avatar: 'BC', avatarBg: '#059669' },
      { userId: 'USR-004', name: 'Elena Rostova', role: 'VP Global Audit', avatar: 'ER', avatarBg: '#0D9488' },
      { userId: 'USR-005', name: 'Chen Wei', role: 'Suzhou Plant Controller', avatar: 'CW', avatarBg: '#D97706' },
    ],
    [currentUser, activeRole]
  );

  const currentCommentUser: CommentUser = useMemo(
    () => ({
      userId: currentUser?.userId || 'USR-001',
      name: currentUser?.name || 'Current Auditor',
      role: activeRole?.label || 'Internal Audit',
      avatar: (currentUser?.name || 'CA').split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase(),
      avatarBg: '#000099',
    }),
    [currentUser, activeRole]
  );

  // Role Detection: Director & VP
  const roleLower = (userRole || '').toLowerCase();
  const isDirector = roleLower.includes('director');
  const isVP = roleLower.includes('vp');
  const isDirectorOrVP = isDirector || isVP;

  // Check if zero-issue mode (FRD zero-issue executive summary)
  const isZeroIssue = useMemo(() => {
    if (execData?.isZeroIssue) return true;
    const engAny = activeEngagement as any;
    if (engAny) {
      const activeIssues = Array.isArray(engAny.issuesList)
        ? engAny.issuesList.filter((iss: any) => iss.status !== 'Excluded' && iss.status !== 822500009)
        : [];
      return activeIssues.length === 0;
    }
    return false;
  }, [execData, activeEngagement]);

  useEffect(() => {
    if (isZeroIssue && expandedSection === 'issues') {
      setExpandedSection('scope');
    }
  }, [isZeroIssue, expandedSection]);

  // Check if report has even one critical issue
  const hasCriticalIssues = useMemo(() => {
    if (isZeroIssue) return false;
    const engAny = activeEngagement as any;
    if (engAny?.issuesList && engAny.issuesList.length > 0) {
      return engAny.issuesList.some(
        (iss: any) => (iss.criticality || iss.severity || '').toLowerCase() === 'critical'
      );
    }
    if (execData?.scopeSummary?.processMatrix) {
      return execData.scopeSummary.processMatrix.some((r) => (r.critical || 0) > 0);
    }
    return false;
  }, [isZeroIssue, activeEngagement, execData]);

  const isPushDisabled = isDirector && !isVP && hasCriticalIssues;

  // Submission Role Config
  const roleConfig = useMemo(() => {
    const r = roleLower;
    if (r.includes('auditor') || r.includes('coordinator') || r.includes('business')) {
      return { hasReportSubmission: false, reportSubmitLabel: '' };
    }
    if (r.includes('vp')) {
      return { hasReportSubmission: true, reportSubmitLabel: 'Sign-Off' };
    }
    if (r.includes('director')) {
      return { hasReportSubmission: true, reportSubmitLabel: 'Submit to VP' };
    }
    return { hasReportSubmission: true, reportSubmitLabel: 'Submit to Director' };
  }, [roleLower]);

  // Splitter mouse move & mouse up listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingSplitter || !containerRef.current) return;
      const containerRect = containerRef.current.getBoundingClientRect();
      const mouseX = e.clientX - containerRect.left;
      const newPct = Math.min(Math.max((mouseX / containerRect.width) * 100, 25), 80);
      setLeftWidth(Math.round(newPct));
    };

    const handleMouseUp = () => {
      setIsDraggingSplitter(false);
    };

    if (isDraggingSplitter) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    }
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDraggingSplitter]);

  // Close active comment popover on click outside (unless popped out to side drawer)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // If drawer mode is active, do not dismiss on click outside
      if (document.querySelector('[data-field-comment-drawer="true"]')) {
        return;
      }
      const target = e.target as HTMLElement;
      if (!target.closest('[data-field-comment-container]')) {
        setActiveCommentField(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Field change log recorder
  const recordFieldChange = (fieldName: string, oldVal: any, newVal: any) => {
    const newLog: AuditTrailLog = {
      logId: `EXEC-LIVE-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      entityName: 'cr_executive_report',
      recordId: execData.id,
      action: 'FIELD_EDIT',
      previousState: String(oldVal ?? '-'),
      newState: String(newVal ?? '-'),
      performedByUserId: currentUser?.userId || 'USR-001',
      performedByUserName: currentUser?.name || 'Current Auditor',
      userRole: activeRole?.label || 'Internal Auditor',
      timestamp: new Date().toISOString(),
      remarks: `Modified ${fieldName}`,
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  // Field change handlers
  const handleScopeChange = (field: string, val: string) => {
    const oldVal = (execData.scopeSummary as any)[field];
    if (oldVal !== val) {
      recordFieldChange(`Scope Summary — ${field}`, oldVal, val);
    }
    setExecData((prev) => ({
      ...prev,
      scopeSummary: {
        ...prev.scopeSummary,
        [field]: val,
      },
    }));
  };

  // Process Matrix Row Update with automatic total and grand total recalculation
  const handleProcessMatrixChange = (index: number, field: string, val: any) => {
    setExecData((prev) => {
      const newMatrix = [...prev.scopeSummary.processMatrix];
      const targetRow = { ...newMatrix[index] };

      if (['critical', 'major', 'minor'].includes(field)) {
        const numVal = Math.max(0, parseInt(val, 10) || 0);
        (targetRow as any)[field] = numVal;
        targetRow.total = (targetRow.critical || 0) + (targetRow.major || 0) + (targetRow.minor || 0);
      } else {
        (targetRow as any)[field] = val;
      }
      newMatrix[index] = targetRow;

      const oldVal = (prev.scopeSummary.processMatrix[index] as any)?.[field];
      if (oldVal !== val) {
        recordFieldChange(`Process Matrix — ${targetRow.processTitle || 'Process'} (${field})`, oldVal, val);
      }

      // Recalculate Grand Total row (last row) if editing regular rows
      if (index < newMatrix.length - 1) {
        const grandTotalRow = { ...newMatrix[newMatrix.length - 1] };
        let grandCrit = 0;
        let grandMaj = 0;
        let grandMin = 0;
        let grandAll = 0;
        for (let i = 0; i < newMatrix.length - 1; i++) {
          grandCrit += newMatrix[i].critical || 0;
          grandMaj += newMatrix[i].major || 0;
          grandMin += newMatrix[i].minor || 0;
          grandAll += newMatrix[i].total || 0;
        }
        grandTotalRow.critical = grandCrit;
        grandTotalRow.major = grandMaj;
        grandTotalRow.minor = grandMin;
        grandTotalRow.total = grandAll;
        newMatrix[newMatrix.length - 1] = grandTotalRow;
      }

      return {
        ...prev,
        scopeSummary: {
          ...prev.scopeSummary,
          processMatrix: newMatrix,
        },
      };
    });
  };

  const handleAddProcessRow = () => {
    setExecData((prev) => {
      const newMatrix = [...prev.scopeSummary.processMatrix];
      const grandTotalRow = newMatrix.pop() || {
        processTitle: 'Grand Total',
        critical: 0,
        major: 0,
        minor: 0,
        total: 0,
      };
      newMatrix.push({
        processTitle: 'New Operational Process',
        critical: 0,
        major: 0,
        minor: 0,
        total: 0,
      });
      newMatrix.push(grandTotalRow);
      recordFieldChange('Process Matrix', 'Added Row', 'New Operational Process');
      return {
        ...prev,
        scopeSummary: {
          ...prev.scopeSummary,
          processMatrix: newMatrix,
        },
      };
    });
  };

  const handleRemoveProcessRow = (idx: number) => {
    setExecData((prev) => {
      if (prev.scopeSummary.processMatrix.length <= 2) return prev;
      const removedRow = prev.scopeSummary.processMatrix[idx];
      const newMatrix = prev.scopeSummary.processMatrix.filter((_, i) => i !== idx);

      // Recalculate Grand Total row
      const grandTotalRow = { ...newMatrix[newMatrix.length - 1] };
      let grandCrit = 0;
      let grandMaj = 0;
      let grandMin = 0;
      let grandAll = 0;
      for (let i = 0; i < newMatrix.length - 1; i++) {
        grandCrit += newMatrix[i].critical || 0;
        grandMaj += newMatrix[i].major || 0;
        grandMin += newMatrix[i].minor || 0;
        grandAll += newMatrix[i].total || 0;
      }
      grandTotalRow.critical = grandCrit;
      grandTotalRow.major = grandMaj;
      grandTotalRow.minor = grandMin;
      grandTotalRow.total = grandAll;
      newMatrix[newMatrix.length - 1] = grandTotalRow;

      recordFieldChange('Process Matrix', `Removed ${removedRow?.processTitle || 'Row'}`, 'Row Deleted');

      return {
        ...prev,
        scopeSummary: {
          ...prev.scopeSummary,
          processMatrix: newMatrix,
        },
      };
    });
  };

  // Section 2 Handlers
  const handleInsightsOverallChange = (val: string) => {
    const oldVal = execData.auditInsights.overallText;
    if (oldVal !== val) {
      recordFieldChange('Audit Insights Summary', oldVal, val);
    }
    setExecData((prev) => ({
      ...prev,
      auditInsights: {
        ...prev.auditInsights,
        overallText: val,
      },
    }));
  };

  // Section 3 Handlers
  const handleIssueChange = (issueType: 'criticalIssue' | 'majorIssue', field: 'title' | 'description', val: string) => {
    const oldVal = (execData.criticalMajorSection[issueType] as any)?.[field];
    if (oldVal !== val) {
      recordFieldChange(`${issueType === 'criticalIssue' ? 'Critical Issue' : 'Major Issue'} — ${field}`, oldVal, val);
    }
    setExecData((prev) => ({
      ...prev,
      criticalMajorSection: {
        ...prev.criticalMajorSection,
        [issueType]: {
          ...prev.criticalMajorSection[issueType],
          [field]: val,
        },
      },
    }));
  };

  // Generate Executive Summary AI Synthesis
  const handleGenerateExecSummary = () => {
    setToastMessage({
      title: 'AI Synthesis In Progress',
      message: 'Synthesizing executive summary insights from completed audit workpapers...',
      severity: 'info',
    });

    setTimeout(() => {
      setExecData((prev) => ({
        ...prev,
        auditInsights: {
          ...prev.auditInsights,
          overallText: `for the processes reviewed, ${
            hasCriticalIssues ? '1 critical, 1 major and 6 minor' : '0 critical, 2 major and 4 minor'
          } findings were identified, 0 of which were repeated`,
          narrativeHtml: `<p>The audit findings highlight significant deficiencies in the accuracy and management of lease-related data and user access reviews within the organization's systems. Inaccurate documentation of lease modification and renewal dates has led to financial misstatements, including an understatement of lease liabilities by USD 1.28M, which could impact financial reporting integrity and compliance.</p><p>Furthermore, the incomplete user access review process, which excludes dormant users with active access, poses a risk to system security and access control. This gap in oversight increases the likelihood of unauthorized access and compromises the organization's ability to maintain robust access governance.</p><p>These issues collectively underscore broader risks to operational efficiency, financial accuracy, and security governance, which may adversely affect the organization's ability to achieve strategic objectives and maintain stakeholder trust.</p>`,
        },
      }));
      setToastMessage({
        title: 'Executive Summary Generated',
        message: 'Intelligent executive summary synthesis applied successfully to all sections.',
        severity: 'success',
      });
    }, 1000);
  };

  // Submit Handler
  const handleSubmit = () => {
    const isVPUser = roleLower.includes('vp');
    const isDirectorUser = roleLower.includes('director');

    setToastMessage({
      title: isVPUser ? 'Executive Sign-Off Executed' : 'Executive Report Submitted',
      message: isVPUser
        ? 'Executive Summary officially signed off and archived to permanent regulatory repository.'
        : isDirectorUser
        ? 'Executive Summary submitted to Vice President for final sign-off.'
        : 'Executive Summary submitted to Director for review.',
      severity: 'success',
    });
  };

  // Helper to format matrix values: if 0, return '-' (unless it is the All column of total issues row where '0' is expected)
  const formatMatrixVal = (
    val: number | string | undefined | null,
    isAllColumn = false,
    isTotalRow = false
  ) => {
    if (isTotalRow && isAllColumn) {
      return val !== null && val !== undefined && val !== '' ? val : '0';
    }
    if (val === 0 || val === '0' || val === null || val === undefined || val === '') return '-';
    return val;
  };

  // Field Level & Row Level Comments Trigger Renderer
  const renderFieldCommentTrigger = (fieldKey: string, fieldLabel: string, isRowLevel = false) => {
    const commentsList = comments.filter((c) => c.fieldKey === fieldKey);
    const isOpen = activeCommentField === fieldKey;
    const unresolvedCount = commentsList.filter((c) => !c.isResolved).length;
    const isAllResolved = commentsList.length > 0 && unresolvedCount === 0;
    const latestComment = commentsList.length > 0 ? commentsList[commentsList.length - 1] : null;

    const handleToggleComment = (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isOpen) {
        setActiveCommentField(null);
      } else {
        const rect = e.currentTarget.getBoundingClientRect();
        const spaceBelow = window.innerHeight - rect.bottom;
        setPopoverPlacement(spaceBelow < 330 ? 'up' : 'down');
        setActiveCommentField(fieldKey);
      }
    };

    return (
      <div data-field-comment-container="true" style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
        {commentsList.length > 0 ? (
          <button
            type="button"
            onClick={handleToggleComment}
            aria-label={`Comments on ${fieldLabel}: ${commentsList.length} comment(s), ${unresolvedCount} open`}
            title={`Comments on ${fieldLabel}\n${commentsList.length} comment(s) (${unresolvedCount} open). Click to view thread & reply.`}
            style={{
              padding: isRowLevel ? '2px 6px' : '2px 8px',
              fontSize: isRowLevel ? 'var(--type-caption-size, 9.5px)' : 'var(--type-caption-size, 10px)',
              fontWeight: 700,
              borderRadius: '12px',
              border: isAllResolved
                ? isOpen
                  ? '1.5px solid #16A34A'
                  : '1px solid #BBF7D0'
                : isOpen
                ? '1.5px solid #000099'
                : '1px solid #BFDBFE',
              backgroundColor: isAllResolved
                ? isOpen
                  ? '#DCFCE7'
                  : '#F0FDF4'
                : isOpen
                ? '#DBEAFE'
                : '#EFF6FF',
              color: isAllResolved ? '#166534' : '#000099',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '4px',
              boxShadow: isAllResolved ? '0 1px 2px rgba(22,163,74,0.08)' : '0 1px 2px rgba(0,0,153,0.08)',
              transition: 'all 0.15s ease',
              maxWidth: isRowLevel ? '70px' : '220px',
            }}
          >
            {isAllResolved ? (
              <>
                <CheckCircle2 style={{ width: '11px', height: '11px', color: '#16A34A' }} />
                <span style={{ fontSize: 'var(--type-caption-size, 9.5px)', fontWeight: 800 }}>
                  ✓ {isRowLevel ? commentsList.length : `Resolved (${commentsList.length})`}
                </span>
              </>
            ) : (
              <>
                <span
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    backgroundColor: '#000099',
                    color: '#ffffff',
                    fontSize: 'var(--type-caption-size, 8px)',
                    fontWeight: 800,
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {latestComment?.authorName ? latestComment.authorName.charAt(0).toUpperCase() : 'U'}
                </span>

                {!isRowLevel && (
                  <span
                    style={{
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      maxWidth: '110px',
                      fontSize: 'var(--type-caption-size, 9.5px)',
                      color: '#1E3A8A',
                    }}
                  >
                    <strong>{latestComment?.authorName ? latestComment.authorName.split(' ')[0] : 'Note'}:</strong> "{latestComment?.content || ''}"
                  </span>
                )}

                <span
                  style={{
                    backgroundColor: unresolvedCount > 0 ? '#000099' : '#16A34A',
                    color: '#ffffff',
                    borderRadius: '8px',
                    padding: '0 4px',
                    fontSize: 'var(--type-caption-size, 9px)',
                    fontWeight: 800,
                    lineHeight: '12px',
                  }}
                >
                  {unresolvedCount}
                </span>
              </>
            )}
          </button>
        ) : (
          <button
            type="button"
            onClick={handleToggleComment}
            aria-label={`Add comment on ${fieldLabel}`}
            title={`Add a comment on ${fieldLabel}`}
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
            <span>{isRowLevel ? '' : '+ Comment'}</span>
          </button>
        )}

        <FieldCommentPopover
          isOpen={isOpen}
          onClose={() => setActiveCommentField(null)}
          engagementId={execData.id}
          fieldKey={fieldKey}
          fieldLabel={fieldLabel}
          comments={commentsList}
          currentUser={currentCommentUser}
          availableUsers={availableUsers}
          placement={popoverPlacement}
          onAddComment={(text, taggedUser) => {
            const newComment: IssueComment = {
              commentId: `COMM-${Date.now()}`,
              issueId: execData.id,
              fieldKey,
              content: text,
              authorId: currentUser?.userId || 'USR-001',
              authorName: currentUser?.name || 'Current Auditor',
              isResolved: false,
              createdAt: new Date().toISOString(),
              taggedUserId: taggedUser?.userId,
              taggedUserName: taggedUser?.name,
            };
            setComments((prev) => [...prev, newComment]);
            setToastMessage({ message: `Comment posted on ${fieldLabel}`, severity: 'info' });
          }}
          onResolveComment={(commentId) => {
            setComments((prev) =>
              prev.map((c) =>
                c.commentId === commentId
                  ? {
                      ...c,
                      isResolved: true,
                      resolvedById: currentUser?.userId || 'USR-001',
                      resolvedByName: currentUser?.name || 'Current Auditor',
                      resolvedAt: new Date().toISOString(),
                    }
                  : c
              )
            );
            setToastMessage({ message: 'Comment resolved', severity: 'success' });
          }}
        />
      </div>
    );
  };

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
      <PageHeader
        onBack={() => setActiveReportingView('queue')}
        backTitle="Back to Reporting Queue"
        title={`Executive Summary — ${(activeEngagement as any)?.fileName || (activeEngagement as any)?.engagement || execData.fileName}`}
        actions={
          <SharedSelectButton
            label="Report Actions"
            size="small"
            menuWidth={230}
            title="Executive Report Actions"
            items={[
              ...(roleConfig.hasReportSubmission
                ? [
                    {
                      key: 'submit-report',
                      label: roleConfig.reportSubmitLabel,
                      icon: roleLower.includes('vp') ? (
                        <CheckCircle2 style={{ width: '14px', height: '14px', color: '#000099' }} />
                      ) : (
                        <Send style={{ width: '14px', height: '14px', color: '#000099' }} />
                      ),
                      onClick: handleSubmit,
                      dividerAfter: true,
                    },
                  ]
                : []),
              {
                key: 'generate-summary',
                label: 'Generate Executive Summary',
                icon: <Sparkles style={{ width: '14px', height: '14px', color: '#eb1700' }} />,
                onClick: handleGenerateExecSummary,
              },
              {
                key: 'download-pdf',
                label: 'Download Report',
                icon: <Download style={{ width: '14px', height: '14px', color: '#000099' }} />,
                onClick: () => window.print(),
              },
              ...(isDirectorOrVP
                ? [
                    {
                      key: 'push-teammate',
                      label: isPushDisabled ? 'Push to Teammate (Sign-off gate)' : 'Push to Teammate',
                      disabled: isPushDisabled,
                      icon: (
                        <Send
                          style={{
                            width: '14px',
                            height: '14px',
                            color: isPushDisabled ? '#94A3B8' : '#7C3AED',
                          }}
                        />
                      ),
                      onClick: () => {
                        if (!isPushDisabled) {
                          setToastMessage({
                            title: 'Push to Teammate Initiated',
                            message: `Executive summary review for ${
                              (activeEngagement as any)?.fileName || execData.fileName
                            } has been initiated and pushed to teammate.`,
                            severity: 'success',
                          });
                        }
                      },
                    },
                  ]
                : []),
              {
                key: 'audit-report',
                label: 'Audit Report',
                icon: <FileText style={{ width: '14px', height: '14px', color: '#000099' }} />,
                onClick: () => setActiveReportingView('audit-studio'),
              },
              {
                key: 'workflow-stages',
                label: 'Workflow',
                icon: <GitBranch style={{ width: '14px', height: '14px', color: '#000099' }} />,
                onClick: () => setIsWorkflowModalOpen(true),
              },
              {
                key: 'track-changes',
                label: 'Track Changes',
                icon: <History style={{ width: '14px', height: '14px', color: '#eb1700' }} />,
                onClick: () => setIsLogsModalOpen(true),
              },
            ]}
          />
        }
      />

      {/* Main Studio Body: Left Form Panel | Resizable Splitter | Right Live HTML PDF Preview */}
      <div
        ref={containerRef}
        style={{
          flex: 1,
          minHeight: 0,
          display: 'flex',
          overflow: 'hidden',
          position: 'relative',
          userSelect: isDraggingSplitter ? 'none' : 'auto',
          backgroundColor: '#F4F6F8',
        }}
      >
        {/* ========================================================================= */}
        {/* LEFT COLUMN: EDITABLE ACCORDION SECTIONS                                  */}
        {/* ========================================================================= */}
        {isLeftCollapsed ? (
          <div
            style={{
              width: '36px',
              minWidth: '36px',
              backgroundColor: '#F4F6F8',
              borderRight: 'none',
              boxShadow: '3px 0 10px rgba(0, 0, 0, 0.08)',
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
              onClick={() => setIsLeftCollapsed(false)}
              aria-label="Expand Executive Form Editor"
              title="Expand Executive Form Editor"
              style={{
                background: 'none',
                border: 'none',
                padding: '4px',
                color: '#64748B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
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
                fontSize: 'var(--type-table-header-size, 11px)',
                fontWeight: 800,
                color: '#475569',
                letterSpacing: '1px',
                whiteSpace: 'nowrap',
              }}
            >
              EXECUTIVE FORM
            </div>
          </div>
        ) : (
          <div
            className="no-scrollbar"
            style={{
              width: isRightCollapsed ? '100%' : `${leftWidth}%`,
              minWidth: '320px',
              maxWidth: isRightCollapsed ? '100%' : '85%',
              height: '100%',
              borderRight: 'none',
              backgroundColor: '#F4F6F8',
              boxShadow: '3px 0 10px rgba(0, 0, 0, 0.08)',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              zIndex: 10,
              position: 'relative',
              flexShrink: 0,
              transition: isDraggingSplitter ? 'none' : 'width 0.2s ease',
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            <div style={{ padding: '18px 28px 24px 28px', display: 'flex', flexDirection: 'column', gap: '14px', flex: 1 }}>
              {/* SECTION 1 ACCORDION: Scope Summary & Process Matrix (Page 1) */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  overflow: expandedSection === 'scope' ? 'visible' : 'hidden',
                }}
              >
                <button
                  type="button"
                  onClick={() => setExpandedSection(expandedSection === 'scope' ? null : 'scope')}
                  aria-expanded={expandedSection === 'scope'}
                  aria-controls="scope-section-content"
                  style={{
                    border: 'none',
                    borderBottom: 'none',
                    background: expandedSection === 'scope' ? '#EFF6FF' : '#ffffff',
                    color: '#0F172A',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: 'var(--type-section-title-size, 13px)',
                    fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    width: '100%',
                    textAlign: 'left',
                    borderTopLeftRadius: '8px',
                    borderTopRightRadius: '8px',
                    borderBottomLeftRadius: expandedSection === 'scope' ? '0' : '8px',
                    borderBottomRightRadius: expandedSection === 'scope' ? '0' : '8px',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = expandedSection === 'scope' ? '#E0EEFF' : '#F8FAFC';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = expandedSection === 'scope' ? '#EFF6FF' : '#ffffff';
                  }}
                >
                  <span
                    className="type-section-title"
                    style={{
                      fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
                      fontSize: 'var(--type-section-title-size, 13px)',
                      fontWeight: 'var(--type-section-title-weight, 700)' as any,
                      color: 'var(--type-section-title-color, #0F172A)'
                    }}
                  >
                    Scope Summary &amp; Process Matrix
                  </span>
                  {expandedSection === 'scope' ? <Minus size={16} color="#0F172A" /> : <Plus size={16} color="#0F172A" />}
                </button>

                {expandedSection === 'scope' && (
                  <div id="scope-section-content" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Assessment Period */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <SharedFieldLabel label="Assessment Period" style={{ marginBottom: 0 }} />
                        {renderFieldCommentTrigger('scope_assessmentPeriod', 'Assessment Period')}
                      </div>
                      <SharedTextInput
                        value={execData.scopeSummary.assessmentPeriod || ''}
                        onChange={(val) => handleScopeChange('assessmentPeriod', val)}
                        placeholder="e.g. Q1 2026 – Q2 2026 (Jan 1, 2026 – Jun 30, 2026)"
                        size="small"
                      />
                    </div>

                    {/* Entity Sector & Entity Location */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <SharedFieldLabel label="Entity Sector" style={{ marginBottom: 0 }} />
                          {renderFieldCommentTrigger('scope_entitySector', 'Entity Sector')}
                        </div>
                        <SharedTextInput
                          value={execData.scopeSummary.entitySector}
                          onChange={(val) => handleScopeChange('entitySector', val)}
                          placeholder="e.g. MedTech / Supply Chain & Operations"
                          size="small"
                        />
                      </div>

                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <SharedFieldLabel label="Entity Location" style={{ marginBottom: 0 }} />
                          {renderFieldCommentTrigger('scope_entityLocation', 'Entity Location')}
                        </div>
                        <SharedTextInput
                          value={execData.scopeSummary.entityLocation}
                          onChange={(val) => handleScopeChange('entityLocation', val)}
                          placeholder="e.g. Suzhou Plant & Regional Operations Hub"
                          size="small"
                        />
                      </div>
                    </div>

                    {/* Metric */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <SharedFieldLabel label="Metric" style={{ marginBottom: 0 }} />
                        {renderFieldCommentTrigger('scope_metric', 'Metric')}
                      </div>
                      <SharedTextInput
                        value={execData.scopeSummary.metric}
                        onChange={(val) => handleScopeChange('metric', val)}
                        placeholder="e.g. GxP Compliance, SOX 404 Controls & IT Access Security"
                        size="small"
                      />
                    </div>

                    {/* Objective */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <SharedFieldLabel label="Objective" style={{ marginBottom: 0 }} />
                        {renderFieldCommentTrigger('scope_objective', 'Objective')}
                      </div>
                      <SharedTextArea
                        value={
                          execData.scopeSummary.objectiveText !== undefined
                            ? execData.scopeSummary.objectiveText
                            : execData.scopeSummary.objectiveBullets && execData.scopeSummary.objectiveBullets.length > 0
                            ? execData.scopeSummary.objectiveBullets.join('\n')
                            : (execData.scopeSummary.objectiveHtml || '')
                                .replace(/<\/li><li>/g, '\n')
                                .replace(/<[^>]*>/g, '')
                                .trim()
                        }
                        onChange={(val) => {
                          if (isZeroIssue || execData.scopeSummary.objectiveText !== undefined) {
                            handleScopeChange('objectiveText', val);
                          } else {
                            const bullets = val.split('\n').map((b) => b.trim()).filter(Boolean);
                            const html = `<ul>${bullets.map((b) => `<li>${b}</li>`).join('')}</ul>`;
                            handleScopeChange('objectiveHtml', html);
                            setExecData((prev) => ({
                              ...prev,
                              scopeSummary: {
                                ...prev.scopeSummary,
                                objectiveBullets: bullets,
                                objectiveHtml: html,
                              },
                            }));
                          }
                        }}
                        placeholder="Enter audit objective bullet points (one per line)..."
                        rows={3}
                        showCharCount
                      />
                    </div>

                    {/* Process Breakdown Matrix Table Editor with Add/Delete, Row Comments & Grand Total */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <SharedFieldLabel label="Process Breakdown Matrix" style={{ marginBottom: 0 }} />
                        <SharedButton
                          variant="outline"
                          size="small"
                          startIcon={<Plus size={12} />}
                          onClick={handleAddProcessRow}
                          style={{ minHeight: 'var(--control-min-height-compact, 1.625rem)', fontSize: 'var(--type-caption-size, 11px)', padding: '0 8px' }}
                        >
                          Add Row
                        </SharedButton>
                      </div>

                      <div style={{ width: '100%', overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--type-table-header-size, 11px)', border: '1px solid #CBD5E1', borderRadius: '6px', overflow: 'hidden', minWidth: '420px' }}>
                          <thead>
                            <tr style={{ backgroundColor: '#F8FAFC', color: 'var(--type-table-header-color, #475569)', fontFamily: 'var(--type-font-family, "jj-circular", Arial, sans-serif)' }}>
                              <th className="type-table-header" style={{ padding: '8px 8px', textAlign: 'left', fontWeight: 'var(--type-table-header-weight, 700)' as any, textTransform: 'uppercase', letterSpacing: '0.04em', fontSize: 'var(--type-table-header-size, 11px)' }}>Process Title</th>
                              <th className="type-table-header" style={{ padding: '8px 4px', textAlign: 'center', fontWeight: 'var(--type-table-header-weight, 700)' as any, width: '52px', color: '#D8001D', textTransform: 'uppercase', fontSize: 'var(--type-table-header-size, 11px)' }}>Crit</th>
                              <th className="type-table-header" style={{ padding: '8px 4px', textAlign: 'center', fontWeight: 'var(--type-table-header-weight, 700)' as any, width: '52px', color: '#D97706', textTransform: 'uppercase', fontSize: 'var(--type-table-header-size, 11px)' }}>Maj</th>
                              <th className="type-table-header" style={{ padding: '8px 4px', textAlign: 'center', fontWeight: 'var(--type-table-header-weight, 700)' as any, width: '52px', color: '#047857', textTransform: 'uppercase', fontSize: 'var(--type-table-header-size, 11px)' }}>Min</th>
                              <th className="type-table-header" style={{ padding: '8px 4px', textAlign: 'center', fontWeight: 'var(--type-table-header-weight, 700)' as any, width: '48px', textTransform: 'uppercase', fontSize: 'var(--type-table-header-size, 11px)' }}>ALL</th>
                              <th className="type-table-header" style={{ padding: '8px 4px', textAlign: 'center', fontWeight: 'var(--type-table-header-weight, 700)' as any, width: '56px', color: '#475569', textTransform: 'uppercase', fontSize: 'var(--type-table-header-size, 11px)' }} title="Row Level Comments">💬 Note</th>
                              <th style={{ width: '28px' }}></th>
                            </tr>
                          </thead>
                          <tbody>
                            {execData.scopeSummary.processMatrix.map((row, idx) => {
                              const isGrandTotal = idx === execData.scopeSummary.processMatrix.length - 1;
                              return (
                                <tr
                                  key={idx}
                                  style={{
                                    borderBottom: '1px solid #E2E8F0',
                                    backgroundColor: isGrandTotal ? '#F8FAFC' : '#ffffff',
                                    fontWeight: isGrandTotal ? 800 : 'normal',
                                    fontFamily: 'var(--type-font-family, "jj-circular", Arial, sans-serif)',
                                  }}
                                >
                                  <td style={{ padding: '4px 6px' }}>
                                    {isGrandTotal ? (
                                      <span style={{ fontWeight: 800, color: '#0F172A', fontSize: 'var(--type-table-row-size, 12px)', fontFamily: 'var(--type-font-family, "jj-circular", Arial, sans-serif)' }}>
                                        {row.processTitle}
                                      </span>
                                    ) : (
                                      <SharedTextInput
                                        value={row.processTitle}
                                        onChange={(val) => handleProcessMatrixChange(idx, 'processTitle', val)}
                                        placeholder="Process title..."
                                        size="small"
                                      />
                                    )}
                                  </td>
                                  <td style={{ padding: '4px 2px', textAlign: 'center', width: '52px' }}>
                                    {isGrandTotal ? (
                                      <span style={{ fontWeight: 800, fontSize: 'var(--type-table-row-size, 12px)', color: '#D8001D', fontFamily: 'var(--type-font-family, "jj-circular", Arial, sans-serif)' }}>
                                        {row.critical}
                                      </span>
                                    ) : (
                                      <SharedTextInput
                                        type="number"
                                        value={String(row.critical ?? 0)}
                                        onChange={(val) => handleProcessMatrixChange(idx, 'critical', val)}
                                        size="small"
                                        inputClassName="text-center font-bold text-xs"
                                      />
                                    )}
                                  </td>
                                  <td style={{ padding: '4px 2px', textAlign: 'center', width: '52px' }}>
                                    {isGrandTotal ? (
                                      <span style={{ fontWeight: 800, fontSize: 'var(--type-table-row-size, 12px)', color: '#D97706', fontFamily: 'var(--type-font-family, "jj-circular", Arial, sans-serif)' }}>
                                        {row.major}
                                      </span>
                                    ) : (
                                      <SharedTextInput
                                        type="number"
                                        value={String(row.major ?? 0)}
                                        onChange={(val) => handleProcessMatrixChange(idx, 'major', val)}
                                        size="small"
                                        inputClassName="text-center font-bold text-xs"
                                      />
                                    )}
                                  </td>
                                  <td style={{ padding: '4px 2px', textAlign: 'center', width: '52px' }}>
                                    {isGrandTotal ? (
                                      <span style={{ fontWeight: 800, fontSize: 'var(--type-table-row-size, 12px)', color: '#047857', fontFamily: 'var(--type-font-family, "jj-circular", Arial, sans-serif)' }}>
                                        {row.minor}
                                      </span>
                                    ) : (
                                      <SharedTextInput
                                        type="number"
                                        value={String(row.minor ?? 0)}
                                        onChange={(val) => handleProcessMatrixChange(idx, 'minor', val)}
                                        size="small"
                                        inputClassName="text-center font-bold text-xs"
                                      />
                                    )}
                                  </td>
                                  <td style={{ padding: '4px 6px', textAlign: 'center', fontWeight: 800, color: isGrandTotal ? '#0F172A' : '#475569', fontSize: 'var(--type-table-row-size, 12px)', width: '48px', fontFamily: 'var(--type-font-family, "jj-circular", Arial, sans-serif)' }}>
                                    {row.total}
                                  </td>
                                  {/* Row-Level Comment Trigger */}
                                  <td style={{ padding: '4px 2px', textAlign: 'center', width: '56px' }}>
                                    {!isGrandTotal && renderFieldCommentTrigger(`processMatrix_row_${idx}`, row.processTitle || `Row ${idx + 1}`, true)}
                                  </td>
                                  <td style={{ padding: '2px', textAlign: 'center', width: '28px' }}>
                                    {!isGrandTotal && execData.scopeSummary.processMatrix.length > 2 && (
                                      <button
                                        type="button"
                                        onClick={() => handleRemoveProcessRow(idx)}
                                        aria-label={`Delete process row ${row.processTitle || idx + 1}`}
                                        style={{
                                          border: 'none',
                                          background: 'transparent',
                                          color: '#94A3B8',
                                          cursor: 'pointer',
                                          padding: '3px',
                                          borderRadius: '4px',
                                          display: 'inline-flex',
                                          alignItems: 'center',
                                          justifyContent: 'center',
                                          transition: 'color 0.15s ease',
                                        }}
                                        title="Delete process row"
                                        onMouseEnter={(e) => (e.currentTarget.style.color = '#eb1700')}
                                        onMouseLeave={(e) => (e.currentTarget.style.color = '#94A3B8')}
                                      >
                                        <X style={{ width: '13px', height: '13px' }} />
                                      </button>
                                    )}
                                  </td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Background */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <SharedFieldLabel label="Background" style={{ marginBottom: 0 }} />
                        {renderFieldCommentTrigger('scope_background', 'Background')}
                      </div>
                      <SharedTextArea
                        value={
                          (execData.scopeSummary.background || '')
                            .replace(/<\/p>\s*<p>/gi, '\n\n')
                            .replace(/<br\s*\/?>/gi, '\n')
                            .replace(/<[^>]*>/g, '')
                            .trim()
                        }
                        onChange={(val) => {
                          const paras = val.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
                          const html = paras.map((p) => `<p>${p}</p>`).join('');
                          handleScopeChange('background', html);
                        }}
                        placeholder="Enter background section narrative..."
                        rows={6}
                        showCharCount
                        maxLength={5000}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 2 ACCORDION: Audit Insights (Page 2) */}
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  overflow: expandedSection === 'insights' ? 'visible' : 'hidden',
                }}
              >
                <button
                  type="button"
                  onClick={() => setExpandedSection(expandedSection === 'insights' ? null : 'insights')}
                  aria-expanded={expandedSection === 'insights'}
                  aria-controls="insights-section-content"
                  style={{
                    border: 'none',
                    borderBottom: 'none',
                    background: expandedSection === 'insights' ? '#EFF6FF' : '#ffffff',
                    color: '#0F172A',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: 'var(--type-section-title-size, 13px)',
                    fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    width: '100%',
                    textAlign: 'left',
                    borderTopLeftRadius: '8px',
                    borderTopRightRadius: '8px',
                    borderBottomLeftRadius: expandedSection === 'insights' ? '0' : '8px',
                    borderBottomRightRadius: expandedSection === 'insights' ? '0' : '8px',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = expandedSection === 'insights' ? '#E0EEFF' : '#F8FAFC';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = expandedSection === 'insights' ? '#EFF6FF' : '#ffffff';
                  }}
                >
                  <span
                    className="type-section-title"
                    style={{
                      fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
                      fontSize: 'var(--type-section-title-size, 13px)',
                      fontWeight: 'var(--type-section-title-weight, 700)' as any,
                      color: 'var(--type-section-title-color, #0F172A)'
                    }}
                  >
                    Audit Insights
                  </span>
                  {expandedSection === 'insights' ? <Minus size={16} color="#0F172A" /> : <Plus size={16} color="#0F172A" />}
                </button>

                {expandedSection === 'insights' && (
                  <div id="insights-section-content" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Overall Summary Line */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <SharedFieldLabel label="Overall Summary Line" style={{ marginBottom: 0 }} />
                        {renderFieldCommentTrigger('insights_overall', 'Overall Line')}
                      </div>
                      <SharedTextInput
                        value={execData.auditInsights.overallText}
                        onChange={(val) => handleInsightsOverallChange(val)}
                        placeholder="for the processes reviewed, 1 critical, 1 major and 6 minor findings were identified..."
                        size="small"
                      />
                    </div>

                    {/* Audit Insights Narrative */}
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <SharedFieldLabel label="Audit Insights Narrative" style={{ marginBottom: 0 }} />
                        {renderFieldCommentTrigger('insights_narrative', 'Audit Insights')}
                      </div>
                      <SharedTextArea
                        value={
                          execData.auditInsights.paragraphs && execData.auditInsights.paragraphs.length > 0
                            ? execData.auditInsights.paragraphs.join('\n\n')
                            : (execData.auditInsights.narrativeHtml || '')
                                .replace(/<\/p><p>/g, '\n\n')
                                .replace(/<[^>]*>/g, '')
                                .trim()
                        }
                        onChange={(val) => {
                          const paras = val.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
                          const html = paras.map((p) => `<p>${p}</p>`).join('');
                          setExecData((prev) => ({
                            ...prev,
                            auditInsights: {
                              ...prev.auditInsights,
                              paragraphs: paras,
                              narrativeHtml: html,
                            },
                          }));
                          recordFieldChange('Audit Insights Narrative', execData.auditInsights.overallText, val);
                        }}
                        placeholder="Enter audit insights narrative paragraphs (separate paragraphs with blank lines)..."
                        rows={6}
                        showCharCount
                        maxLength={5000}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 3 ACCORDION: Critical Issues / Major Issues (Page 2) - Hidden for zero-issue audits */}
              {!isZeroIssue && (
              <div
                style={{
                  backgroundColor: '#ffffff',
                  borderRadius: '8px',
                  border: '1px solid #E2E8F0',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
                  overflow: expandedSection === 'issues' ? 'visible' : 'hidden',
                }}
              >
                <button
                  type="button"
                  onClick={() => setExpandedSection(expandedSection === 'issues' ? null : 'issues')}
                  aria-expanded={expandedSection === 'issues'}
                  aria-controls="issues-section-content"
                  style={{
                    border: 'none',
                    borderBottom: 'none',
                    background: expandedSection === 'issues' ? '#EFF6FF' : '#ffffff',
                    color: '#0F172A',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: 'var(--type-section-title-size, 13px)',
                    fontFamily: '"jj-circular", Arial, Helvetica, sans-serif',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    width: '100%',
                    textAlign: 'left',
                    borderTopLeftRadius: '8px',
                    borderTopRightRadius: '8px',
                    borderBottomLeftRadius: expandedSection === 'issues' ? '0' : '8px',
                    borderBottomRightRadius: expandedSection === 'issues' ? '0' : '8px',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = expandedSection === 'issues' ? '#E0EEFF' : '#F8FAFC';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = expandedSection === 'issues' ? '#EFF6FF' : '#ffffff';
                  }}
                >
                  <span
                    className="type-section-title"
                    style={{
                      fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
                      fontSize: 'var(--type-section-title-size, 13px)',
                      fontWeight: 'var(--type-section-title-weight, 700)' as any,
                      color: 'var(--type-section-title-color, #0F172A)'
                    }}
                  >
                    Critical Issues / Major Issues
                  </span>
                  {expandedSection === 'issues' ? <Minus size={16} color="#0F172A" /> : <Plus size={16} color="#0F172A" />}
                </button>

                {expandedSection === 'issues' && (
                  <div id="issues-section-content" style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {/* Critical Issue */}
                    {execData.criticalMajorSection.criticalIssue && (
                      <div style={{ backgroundColor: '#FEF2F2', padding: '14px', borderRadius: '6px', border: '1px solid #FECDD3' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#D8001D' }} />
                          <span style={{ fontSize: 'var(--type-table-header-size, 11px)', fontWeight: 800, color: '#991B1B', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"jj-circular", Arial, Helvetica, sans-serif' }}>
                            Critical Issue
                          </span>
                        </div>

                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <SharedFieldLabel label="Title" style={{ marginBottom: 0, color: '#7F1D1D' }} />
                            {renderFieldCommentTrigger('criticalIssue_title', 'Critical Issue Title')}
                          </div>
                          <SharedTextInput
                            value={execData.criticalMajorSection.criticalIssue.title}
                            onChange={(val) => handleIssueChange('criticalIssue', 'title', val)}
                            placeholder="Enter critical issue title..."
                            size="small"
                          />
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <SharedFieldLabel label="Description" style={{ marginBottom: 0, color: '#7F1D1D' }} />
                            {renderFieldCommentTrigger('criticalIssue_description', 'Critical Issue Description')}
                          </div>
                          <SharedTextArea
                            rows={3}
                            value={execData.criticalMajorSection.criticalIssue.description}
                            onChange={(val) => handleIssueChange('criticalIssue', 'description', val)}
                            placeholder="Enter detailed critical issue description..."
                            showCharCount
                          />
                        </div>
                      </div>
                    )}

                    {/* Major Issue */}
                    {execData.criticalMajorSection.majorIssue && (
                      <div style={{ backgroundColor: '#FFFBEB', padding: '14px', borderRadius: '6px', border: '1px solid #FDE68A' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#D97706' }} />
                          <span style={{ fontSize: 'var(--type-table-header-size, 11px)', fontWeight: 800, color: '#92400E', textTransform: 'uppercase', letterSpacing: '0.05em', fontFamily: '"jj-circular", Arial, Helvetica, sans-serif' }}>
                            Major Issue
                          </span>
                        </div>

                        <div style={{ marginBottom: '10px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <SharedFieldLabel label="Title" style={{ marginBottom: 0, color: '#78350F' }} />
                            {renderFieldCommentTrigger('majorIssue_title', 'Major Issue Title')}
                          </div>
                          <SharedTextInput
                            value={execData.criticalMajorSection.majorIssue.title}
                            onChange={(val) => handleIssueChange('majorIssue', 'title', val)}
                            placeholder="Enter major issue title..."
                            size="small"
                          />
                        </div>

                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                            <SharedFieldLabel label="Description" style={{ marginBottom: 0, color: '#78350F' }} />
                            {renderFieldCommentTrigger('majorIssue_description', 'Major Issue Description')}
                          </div>
                          <SharedTextArea
                            rows={3}
                            value={execData.criticalMajorSection.majorIssue.description}
                            onChange={(val) => handleIssueChange('majorIssue', 'description', val)}
                            placeholder="Enter detailed major issue description..."
                            showCharCount
                          />
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
              )}
            </div>
          </div>
        )}

        {/* SPLITTER HANDLE */}
        {!isLeftCollapsed && !isRightCollapsed && (
          <div
            role="separator"
            aria-orientation="vertical"
            aria-valuenow={leftWidth}
            aria-valuemin={25}
            aria-valuemax={80}
            tabIndex={0}
            aria-label="Adjust editor and preview panel widths"
            onMouseDown={(e) => {
              e.preventDefault();
              setIsDraggingSplitter(true);
            }}
            onMouseEnter={() => setIsHoveredSplitter(true)}
            onMouseLeave={() => setIsHoveredSplitter(false)}
            title="Click and drag to adjust width"
            style={{
              width: '6px',
              marginLeft: '-3px',
              marginRight: '-3px',
              backgroundColor: 'transparent',
              position: 'relative',
              cursor: 'col-resize',
              zIndex: 20,
              flexShrink: 0,
              height: '100%',
              outline: 'none',
            }}
          >
            {/* Interactive Adjust-Width Separator (visible on hover or drag) */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: '2px',
                width: '2px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor:
                  isDraggingSplitter || isHoveredSplitter ? '#000099' : 'transparent',
                transition: 'background-color 0.15s ease',
              }}
            >
              <div
                style={{
                  width: '2px',
                  height: '24px',
                  borderRadius: '1px',
                  backgroundColor: '#ffffff',
                  opacity: isDraggingSplitter || isHoveredSplitter ? 1 : 0,
                  transition: 'opacity 0.15s ease',
                }}
              />
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: LIVE HTML PDF PREVIEW (MATCHING BACKUP_JNJ_IAR VERBATIM)     */}
        {/* ========================================================================= */}
        {isRightCollapsed ? (
          <div
            style={{
              width: '36px',
              minWidth: '36px',
              backgroundColor: '#E8EDF2',
              borderLeft: 'none',
              boxShadow: '-2px 0 6px rgba(0, 0, 0, 0.04)',
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
              onClick={() => setIsRightCollapsed(false)}
              aria-label="Expand Report Preview"
              title="Expand Report Preview"
              style={{
                background: 'none',
                border: 'none',
                padding: '4px',
                color: '#64748B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: '4px',
                transition: 'color 0.15s ease',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#000099')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#64748B')}
            >
              <PanelRightOpen style={{ width: '16px', height: '16px' }} />
            </button>
            <div
              style={{
                writingMode: 'vertical-rl',
                transform: 'rotate(180deg)',
                fontSize: 'var(--type-table-header-size, 11px)',
                fontWeight: 800,
                color: '#475569',
                letterSpacing: '1px',
                whiteSpace: 'nowrap',
              }}
            >
              REPORT PREVIEW
            </div>
          </div>
        ) : (
          <div
            className="slim-light-scrollbar"
            style={{
              flex: 1,
              width: isLeftCollapsed ? '100%' : `${100 - leftWidth}%`,
              height: '100%',
              backgroundColor: '#E8EDF2', // Matching Audit Report Pane 3
              padding: '20px',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              boxSizing: 'border-box',
              minWidth: '280px',
              scrollbarWidth: 'thin',
              scrollbarColor: '#CBD5E1 transparent',
              transition: isDraggingSplitter ? 'none' : 'width 0.2s ease',
            }}
          >
            {/* Wrapper for PDF Pages */}
            <div
              style={{
                width: '100%',
                maxWidth: `${(860 * previewZoom) / 100}px`,
                display: 'flex',
                flexDirection: 'column',
                gap: '20px',
                flexShrink: 0,
                marginBottom: '20px',
              }}
            >
              {/* ################################################################# */}
              {/* PAGE 1: EXACT MATCH TO BACKUP_JNJ_IAR                             */}
              {/* ################################################################# */}
              <div
                style={{
                  width: '100%',
                  borderRadius: '4px',
                  overflow: 'hidden',
                  border: '1px solid #D8D8D8',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                  backgroundColor: '#ffffff',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                {/* Red PDF Document Header Bar */}
                <div
                  style={{
                    backgroundColor: '#D8001D',
                    color: '#ffffff',
                    padding: '8px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexShrink: 0,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                    <FileText style={{ width: '16px', height: '16px', color: '#ffffff', flexShrink: 0 }} />
                    <span
                      style={{
                        fontSize: 'var(--type-section-title-size, 13px)',
                        fontWeight: 800,
                        letterSpacing: '0.3px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {(activeEngagement as any)?.fileName || execData.fileName}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '6px',
                        backgroundColor: 'rgba(0, 0, 0, 0.2)',
                        borderRadius: '16px',
                        padding: '2px 8px',
                      }}
                    >
                      <button
                        type="button"
                        onClick={() => setPreviewZoom((z) => Math.max(70, z - 10))}
                        aria-label="Zoom Out"
                        title="Zoom Out"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ffffff',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '2px',
                        }}
                      >
                        <ZoomOut style={{ width: '13px', height: '13px' }} />
                      </button>
                      <span
                        style={{
                          fontSize: 'var(--type-caption-size, 11px)',
                          fontWeight: 800,
                          minWidth: '34px',
                          textAlign: 'center',
                          color: '#ffffff',
                        }}
                      >
                        {previewZoom}%
                      </span>
                      <button
                        type="button"
                        onClick={() => setPreviewZoom((z) => Math.min(130, z + 10))}
                        aria-label="Zoom In"
                        title="Zoom In"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ffffff',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '2px',
                        }}
                      >
                        <ZoomIn style={{ width: '13px', height: '13px' }} />
                      </button>
                      <div
                        style={{
                          width: '1px',
                          height: '12px',
                          backgroundColor: 'rgba(255, 255, 255, 0.4)',
                          margin: '0 2px',
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => window.print()}
                        aria-label="Print Report"
                        title="Print Report"
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#ffffff',
                          cursor: 'pointer',
                          padding: '2px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          borderRadius: '2px',
                        }}
                      >
                        <Printer style={{ width: '13px', height: '13px' }} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsRightCollapsed(true)}
                      aria-label="Collapse Report Preview"
                      title="Collapse Report Preview"
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: '4px',
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        borderRadius: '4px',
                        transition: 'background-color 0.15s ease',
                        flexShrink: 0,
                      }}
                      onMouseEnter={(e) =>
                        (e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.2)')
                      }
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.backgroundColor = 'transparent')
                      }
                    >
                      <PanelRightClose style={{ width: '16px', height: '16px' }} />
                    </button>
                  </div>
                </div>

                <div
                  style={{
                    width: '100%',
                    backgroundColor: '#ffffff',
                    padding: `${(36 * previewZoom) / 100}px ${(36 * previewZoom) / 100}px ${(28 * previewZoom) / 100}px`,
                    boxSizing: 'border-box',
                    fontFamily: 'Arial, Helvetica, sans-serif',
                    color: '#000000',
                    display: 'flex',
                    flexDirection: 'column',
                    minHeight: `${(1000 * previewZoom) / 100}px`,
                    position: 'relative',
                  }}
                >
                {/* Document Title */}
                <div style={{ marginBottom: '18px' }}>
                  <div
                    className="type-page-title"
                    style={{
                      fontSize: 'var(--type-page-title-size, 16px)',
                      fontWeight: 800,
                      color: '#000000',
                      textAlign: 'left',
                      lineHeight: 'var(--type-page-title-leading, 1.2)',
                      letterSpacing: '-0.2px',
                    }}
                  >
                    {execData.fileName}
                  </div>
                </div>

                {/* 1. SCOPE SUMMARY BOX */}
                <div style={{ marginBottom: '16px' }}>
                  {/* Scope Summary Banner Header */}
                  <div
                    className="type-section-title"
                    style={{
                      backgroundColor: '#8F8F8F',
                      border: '1px solid #000000',
                      borderBottom: 'none',
                      color: '#ffffff',
                      fontWeight: 700,
                      fontSize: 'var(--type-section-title-size, 13px)',
                      textAlign: 'center',
                      padding: '5px 10px',
                      letterSpacing: '0.2px',
                    }}
                  >
                    Scope Summary
                  </div>

                  {/* Scope Summary Table */}
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: 'var(--type-table-row-size, 11px)',
                      border: '1px solid #000000',
                      tableLayout: 'fixed',
                    }}
                  >
                    <tbody>
                      {execData.scopeSummary.assessmentPeriod && (
                        <tr>
                          <td style={{ width: '160px', padding: '5px 8px', fontWeight: 700, color: '#000000', border: '1px solid #000000', verticalAlign: 'top' }}>
                            Assessment Period:
                          </td>
                          <td style={{ padding: '5px 8px', color: '#000000', border: '1px solid #000000' }}>
                            {execData.scopeSummary.assessmentPeriod}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td style={{ width: '160px', padding: '5px 8px', fontWeight: 700, color: '#000000', border: '1px solid #000000', verticalAlign: 'top' }}>
                          Entity Sector:
                        </td>
                        <td style={{ padding: '5px 8px', color: '#000000', border: '1px solid #000000' }}>
                          {execData.scopeSummary.entitySector}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '5px 8px', fontWeight: 700, color: '#000000', border: '1px solid #000000', verticalAlign: 'top' }}>
                          Entity Location:
                        </td>
                        <td style={{ padding: '5px 8px', color: '#000000', border: '1px solid #000000' }}>
                          {execData.scopeSummary.entityLocation}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '5px 8px', fontWeight: 700, color: '#000000', border: '1px solid #000000', verticalAlign: 'top' }}>
                          Metric:
                        </td>
                        <td style={{ padding: '5px 8px', color: '#000000', border: '1px solid #000000' }}>
                          {execData.scopeSummary.metric}
                        </td>
                      </tr>
                      <tr>
                        <td style={{ padding: '6px 8px', fontWeight: 700, color: '#000000', border: '1px solid #000000', verticalAlign: 'top' }}>
                          Objective:
                        </td>
                        <td style={{ padding: '6px 8px', color: '#000000', border: '1px solid #000000', lineHeight: '1.4' }}>
                          {execData.scopeSummary.objectiveText ? (
                            <div>{execData.scopeSummary.objectiveText}</div>
                          ) : (
                            <>
                              {execData.scopeSummary.objectivePrefix && (
                                <div style={{ marginBottom: '3px', fontWeight: 500 }}>{execData.scopeSummary.objectivePrefix}</div>
                              )}
                              {execData.scopeSummary.objectiveHtml ? (
                                <div
                                  className="rich-text-preview"
                                  dangerouslySetInnerHTML={{ __html: execData.scopeSummary.objectiveHtml }}
                                />
                              ) : (
                                <ul style={{ margin: 0, paddingLeft: '18px' }}>
                                  {(execData.scopeSummary.objectiveBullets || []).map((bullet, bIdx) => (
                                    <li key={bIdx} style={{ marginBottom: bIdx === (execData.scopeSummary.objectiveBullets?.length || 0) - 1 ? 0 : '4px' }}>
                                      {bullet}
                                    </li>
                                  ))}
                                </ul>
                              )}
                            </>
                          )}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* 2. PROCESS TITLE BREAKDOWN MATRIX (COLOR CODED HEADERS) */}
                <div style={{ marginBottom: '16px' }}>
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: 'var(--type-table-row-size, 11.5px)',
                      border: '1px solid #000000',
                    }}
                  >
                    <thead>
                      <tr>
                        {/* Process Title: In zero-issue mode, white bg, black text, left aligned */}
                        <th
                          style={{
                            backgroundColor: isZeroIssue ? '#ffffff' : '#8F8F8F',
                            color: isZeroIssue ? '#000000' : '#ffffff',
                            fontWeight: 700,
                            textAlign: isZeroIssue ? 'left' : 'center',
                            padding: '6px 10px',
                            border: '1px solid #000000',
                            fontSize: 'var(--type-table-header-size, 12px)',
                          }}
                        >
                          Process Title
                        </th>

                        {/* Critical: Red #CC0000 */}
                        <th
                          style={{
                            backgroundColor: '#CC0000',
                            color: '#ffffff',
                            fontWeight: 700,
                            textAlign: 'center',
                            padding: '6px 10px',
                            border: '1px solid #000000',
                            width: '110px',
                            fontSize: 'var(--type-table-header-size, 12px)',
                          }}
                        >
                          Critical
                        </th>

                        {/* Major: Amber #FFA500 */}
                        <th
                          style={{
                            backgroundColor: '#FFA500',
                            color: '#ffffff',
                            fontWeight: 700,
                            textAlign: 'center',
                            padding: '6px 10px',
                            border: '1px solid #000000',
                            width: '110px',
                            fontSize: 'var(--type-table-header-size, 12px)',
                          }}
                        >
                          Major
                        </th>

                        {/* Minor: Green #2E7D32 */}
                        <th
                          style={{
                            backgroundColor: '#2E7D32',
                            color: '#ffffff',
                            fontWeight: 700,
                            textAlign: 'center',
                            padding: '6px 10px',
                            border: '1px solid #000000',
                            width: '110px',
                            fontSize: 'var(--type-table-header-size, 12px)',
                          }}
                        >
                          Minor
                        </th>

                        {/* ALL: In zero-issue mode, white bg, black text, "All" */}
                        <th
                          style={{
                            backgroundColor: isZeroIssue ? '#ffffff' : '#8F8F8F',
                            color: isZeroIssue ? '#000000' : '#ffffff',
                            fontWeight: 700,
                            textAlign: 'center',
                            padding: '6px 10px',
                            border: '1px solid #000000',
                            width: '110px',
                            fontSize: 'var(--type-table-header-size, 12px)',
                          }}
                        >
                          {isZeroIssue ? 'All' : 'ALL'}
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {execData.scopeSummary.processMatrix.map((row, idx) => {
                        const isTotalRow =
                          idx === execData.scopeSummary.processMatrix.length - 1 ||
                          row.processTitle === 'Total Issues' ||
                          row.processTitle === 'Grand Total';
                        return (
                          <tr key={idx}>
                            <td
                              style={{
                                padding: '6px 10px',
                                color: '#000000',
                                border: '1px solid #000000',
                                fontWeight: isTotalRow ? 700 : 'normal',
                                wordBreak: 'break-word',
                              }}
                            >
                              {row.processTitle}
                            </td>

                            <td
                              style={{
                                padding: '6px 10px',
                                textAlign: 'center',
                                color: '#000000',
                                border: '1px solid #000000',
                                fontWeight: isTotalRow ? 700 : 'normal',
                              }}
                            >
                              {formatMatrixVal(row.critical, false, isTotalRow)}
                            </td>

                            <td
                              style={{
                                padding: '6px 10px',
                                textAlign: 'center',
                                color: '#000000',
                                border: '1px solid #000000',
                                fontWeight: isTotalRow ? 700 : 'normal',
                              }}
                            >
                              {formatMatrixVal(row.major, false, isTotalRow)}
                            </td>

                            <td
                              style={{
                                padding: '6px 10px',
                                textAlign: 'center',
                                color: '#000000',
                                border: '1px solid #000000',
                                fontWeight: isTotalRow ? 700 : 'normal',
                              }}
                            >
                              {formatMatrixVal(row.minor, false, isTotalRow)}
                            </td>

                            <td
                              style={{
                                padding: '6px 10px',
                                textAlign: 'center',
                                color: '#000000',
                                border: '1px solid #000000',
                                fontWeight: isTotalRow ? 700 : 'normal',
                              }}
                            >
                              {formatMatrixVal(row.total, true, isTotalRow)}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* 3. BOTTOM BOX ON PAGE 1: Critical/Major Issues (Zero-Issue mode) OR Background (Standard mode) */}
                {isZeroIssue ? (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginBottom: '24px' }}>
                    <div
                      className="type-section-title"
                      style={{
                        backgroundColor: '#8F8F8F',
                        border: '1px solid #000000',
                        borderBottom: 'none',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: 'var(--type-section-title-size, 13px)',
                        textAlign: 'center',
                        padding: '5px 10px',
                        letterSpacing: '0.2px',
                      }}
                    >
                      Critical/Major Issues
                    </div>

                    <div
                      style={{
                        border: '1px solid #000000',
                        backgroundColor: '#ffffff',
                        padding: '14px',
                        minHeight: '80px',
                        fontSize: 'var(--type-input-text-size, 11.5px)',
                        lineHeight: '1.45',
                        color: '#000000',
                        boxSizing: 'border-box',
                      }}
                    >
                      {execData.criticalMajorSection?.zeroIssueNote ||
                        'The audit review did not identify any critical or major issues.'}
                    </div>
                  </div>
                ) : (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginBottom: '24px' }}>
                    <div
                      className="type-section-title"
                      style={{
                        backgroundColor: '#8F8F8F',
                        border: '1px solid #000000',
                        borderBottom: 'none',
                        color: '#ffffff',
                        fontWeight: 700,
                        fontSize: 'var(--type-section-title-size, 13px)',
                        textAlign: 'center',
                        padding: '5px 10px',
                        letterSpacing: '0.2px',
                      }}
                    >
                      Background
                    </div>

                    <div
                      style={{
                        border: '1px solid #000000',
                        backgroundColor: '#ffffff',
                        padding: '14px',
                        minHeight: '200px',
                        flex: 1,
                        fontSize: 'var(--type-input-text-size, 11px)',
                        lineHeight: '1.45',
                        color: '#000000',
                        boxSizing: 'border-box',
                      }}
                    >
                      {execData.scopeSummary.background ? (
                        <div
                          className="rich-text-preview"
                          dangerouslySetInnerHTML={{ __html: execData.scopeSummary.background }}
                        />
                      ) : (
                        <div style={{ color: '#94A3B8', fontStyle: 'italic' }}>
                          (Background notes and operational context)
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* PAGE 1 FOOTER: Red Johnson & Johnson script logo */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    marginTop: 'auto',
                    paddingTop: '16px',
                    borderTop: '1px solid #E2E8F0',
                  }}
                >
                  <div
                    style={{
                      color: '#D8001D',
                      fontFamily: 'Georgia, serif',
                      fontWeight: 'bold',
                      fontStyle: 'italic',
                      fontSize: '15px',
                      letterSpacing: '-0.2px',
                    }}
                  >
                    Johnson &amp; Johnson
                  </div>

                  <div style={{ fontSize: '10px', color: '#94A3B8' }}>Page 1 of 2</div>
                </div>
              </div>
            </div>

              {/* ################################################################# */}
              {/* PAGE 2: EXACT MATCH TO BACKUP_JNJ_IAR                             */}
              {/* ################################################################# */}
              <div
                style={{
                  width: '100%',
                  backgroundColor: '#ffffff',
                  borderRadius: '4px',
                  border: '1px solid #D8D8D8',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
                  padding: `${(36 * previewZoom) / 100}px ${(36 * previewZoom) / 100}px ${(28 * previewZoom) / 100}px`,
                  boxSizing: 'border-box',
                  fontFamily: 'Arial, Helvetica, sans-serif',
                  color: '#000000',
                  display: 'flex',
                  flexDirection: 'column',
                  minHeight: `${(1000 * previewZoom) / 100}px`,
                  position: 'relative',
                }}
              >
                {/* Header line on Page 2 */}
                <div style={{ marginBottom: '18px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: 'var(--type-table-header-size, 12px)', fontWeight: 700, color: '#64748B' }}>
                    {execData.fileName}
                  </div>
                  <div style={{ fontSize: 'var(--type-caption-size, 10.5px)', color: '#94A3B8' }}>
                    {isZeroIssue ? 'Section 2: Background & Insights' : 'Section 2: Insights & Findings'}
                  </div>
                </div>

                {isZeroIssue ? (
                  <>
                    {/* 1. BACKGROUND BOX (Page 2 in Zero-Issue Mode) */}
                    <div style={{ marginBottom: '18px' }}>
                      <div
                        className="type-section-title"
                        style={{
                          backgroundColor: '#8F8F8F',
                          border: '1px solid #000000',
                          borderBottom: 'none',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: 'var(--type-section-title-size, 13px)',
                          textAlign: 'center',
                          padding: '5px 10px',
                          letterSpacing: '0.2px',
                        }}
                      >
                        Background
                      </div>

                      <div
                        style={{
                          border: '1px solid #000000',
                          backgroundColor: '#ffffff',
                          padding: '12px 14px',
                          fontSize: 'var(--type-input-text-size, 11px)',
                          lineHeight: '1.45',
                          color: '#000000',
                        }}
                      >
                        {execData.scopeSummary.background ? (
                          <div
                            className="rich-text-preview"
                            dangerouslySetInnerHTML={{ __html: execData.scopeSummary.background }}
                          />
                        ) : (
                          <div style={{ color: '#94A3B8', fontStyle: 'italic' }}>
                            (Background notes and operational context)
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 2. AUDIT INSIGHTS BOX (Page 2 in Zero-Issue Mode) */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginBottom: '24px' }}>
                      <div
                        className="type-section-title"
                        style={{
                          backgroundColor: '#8F8F8F',
                          border: '1px solid #000000',
                          borderBottom: 'none',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: 'var(--type-section-title-size, 13px)',
                          textAlign: 'center',
                          padding: '5px 10px',
                          letterSpacing: '0.2px',
                        }}
                      >
                        Audit Insights
                      </div>

                      <div
                        style={{
                          border: '1px solid #000000',
                          backgroundColor: '#ffffff',
                          padding: '12px 14px',
                          fontSize: 'var(--type-input-text-size, 11px)',
                          lineHeight: '1.45',
                          color: '#000000',
                          flex: 1,
                        }}
                      >
                        {/* Overall summary sentence */}
                        <div style={{ marginBottom: '10px', color: '#000000' }}>
                          {execData.auditInsights.overallText?.startsWith('Overall')
                            ? execData.auditInsights.overallText
                            : `Overall ${execData.auditInsights.overallText}`}
                        </div>

                        {/* Narrative paragraphs */}
                        {execData.auditInsights.narrativeHtml ? (
                          <div
                            className="rich-text-preview"
                            dangerouslySetInnerHTML={{ __html: execData.auditInsights.narrativeHtml }}
                          />
                        ) : (
                          (execData.auditInsights.paragraphs || []).map((para, pIdx) => (
                            <p key={pIdx} style={{ margin: '0 0 10px 0', lineHeight: 1.45 }}>
                              {para}
                            </p>
                          ))
                        )}
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    {/* 1. AUDIT INSIGHTS BOX (Standard Mode) */}
                    <div style={{ marginBottom: '18px' }}>
                      <div
                        className="type-section-title"
                        style={{
                          backgroundColor: '#8F8F8F',
                          border: '1px solid #000000',
                          borderBottom: 'none',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: 'var(--type-section-title-size, 13px)',
                          textAlign: 'center',
                          padding: '5px 10px',
                          letterSpacing: '0.2px',
                        }}
                      >
                        Audit Insights
                      </div>

                      <div
                        style={{
                          border: '1px solid #000000',
                          backgroundColor: '#ffffff',
                          padding: '12px 14px',
                          fontSize: 'var(--type-input-text-size, 11px)',
                          lineHeight: '1.45',
                          color: '#000000',
                        }}
                      >
                        {/* First line: Overall underlined */}
                        <div style={{ marginBottom: '10px' }}>
                          <span style={{ textDecoration: 'underline', fontWeight: 700 }}>Overall</span>{' '}
                          <span>{execData.auditInsights.overallText}</span>
                        </div>

                        {/* Narrative paragraphs with rich text support */}
                        {execData.auditInsights.narrativeHtml ? (
                          <div
                            className="rich-text-preview"
                            dangerouslySetInnerHTML={{ __html: execData.auditInsights.narrativeHtml }}
                          />
                        ) : (
                          (execData.auditInsights.paragraphs || []).map((para, pIdx) => (
                            <p key={pIdx} style={{ margin: '0 0 10px 0', lineHeight: 1.45 }}>
                              {para}
                            </p>
                          ))
                        )}
                      </div>
                    </div>

                    {/* 2. CRITICAL ISSUES / MAJOR ISSUES BOX (Standard Mode) */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', marginBottom: '24px' }}>
                      <div
                        className="type-section-title"
                        style={{
                          backgroundColor: '#8F8F8F',
                          border: '1px solid #000000',
                          borderBottom: 'none',
                          color: '#ffffff',
                          fontWeight: 700,
                          fontSize: 'var(--type-section-title-size, 13px)',
                          textAlign: 'center',
                          padding: '5px 10px',
                          letterSpacing: '0.2px',
                        }}
                      >
                        Critical Issues /Major Issues
                      </div>

                      <div
                        style={{
                          border: '1px solid #000000',
                          backgroundColor: '#ffffff',
                          padding: '12px 14px',
                          fontSize: 'var(--type-input-text-size, 11px)',
                          lineHeight: '1.45',
                          color: '#000000',
                          flex: 1,
                        }}
                      >
                        {/* Critical Issues Subheading & Details */}
                        {execData.criticalMajorSection.criticalIssue && (
                          <div style={{ marginBottom: '14px' }}>
                            <div style={{ fontWeight: 700, fontSize: 'var(--type-table-header-size, 12px)', color: '#000000', marginBottom: '4px' }}>
                              Critical Issues
                            </div>
                            <div style={{ fontWeight: 400, color: '#000000', marginBottom: '3px' }}>
                              {execData.criticalMajorSection.criticalIssue.title}
                            </div>
                            <div style={{ color: '#000000', lineHeight: 1.45 }}>
                              {execData.criticalMajorSection.criticalIssue.description}
                            </div>
                          </div>
                        )}

                        {/* Major Issues Subheading & Details */}
                        {execData.criticalMajorSection.majorIssue && (
                          <div>
                            <div style={{ fontWeight: 700, fontSize: 'var(--type-table-header-size, 12px)', color: '#000000', marginBottom: '4px' }}>
                              Major Issues
                            </div>
                            <div style={{ fontWeight: 400, color: '#000000', marginBottom: '3px' }}>
                              {execData.criticalMajorSection.majorIssue.title}
                            </div>
                            <div style={{ color: '#000000', lineHeight: 1.45 }}>
                              {execData.criticalMajorSection.majorIssue.description}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </>
                )}

                {/* PAGE 2 FOOTER: Red Johnson & Johnson script logo */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-end',
                    justifyContent: 'space-between',
                    marginTop: 'auto',
                    paddingTop: '16px',
                    borderTop: '1px solid #E2E8F0',
                  }}
                >
                  <div
                    style={{
                      color: '#D8001D',
                      fontFamily: 'Georgia, serif',
                      fontWeight: 'bold',
                      fontStyle: 'italic',
                      fontSize: '15px',
                      letterSpacing: '-0.2px',
                    }}
                  >
                    Johnson &amp; Johnson
                  </div>

                  <div style={{ fontSize: '10px', color: '#94A3B8' }}>Page 2 of 2</div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Workflow Modal */}
      <WorkflowModal
        isOpen={isWorkflowModalOpen}
        onClose={() => setIsWorkflowModalOpen(false)}
        job={activeEngagement}
        title="Executive Summary Workflow Pipeline"
        type="executive"
      />

      {/* Track Changes Logs Dialog */}
      <IssueLogsDialog
        open={isLogsModalOpen}
        onClose={() => setIsLogsModalOpen(false)}
        issueId={execData.id}
        issueTitle={(activeEngagement as any)?.fileName || execData.fileName}
        logs={auditLogs}
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
