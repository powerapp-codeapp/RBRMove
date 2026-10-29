import React, { useState, useEffect } from 'react';
import {
  X,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Cpu,
  TrendingUp,
  GitBranch,
  ArrowRight,
  UserCheck,
  Calendar,
} from 'lucide-react';
import { SharedTabs } from '../../../components/shared/tabs/SharedTabs';
import {
  getEngagementWorkflowState,
  getUsersByEngagementAndRole,
  getRoleDetails,
} from '../utils/reportingWorkflowEngine';

export interface WorkflowModalProps {
  isOpen: boolean;
  onClose: () => void;
  job?: any;
  report?: any;
  issue?: any;
  issues?: any[];
  title?: string;
  type?: 'audit' | 'executive';
}

/**
 * Dynamically resolves an individual issue's progression status across each workflow stage
 * (Identical logic to Backup_JNJ_IAR/src/components/reporting/WorkflowModal.jsx with J&J brand palette)
 */
export const resolveIssueStageStatuses = (issue: any) => {
  const s = (issue.status || '').toLowerCase();
  const isExcluded = !!issue.isExcluded || s === 'excluded';

  // Baseline stage statuses
  let staff = { label: '✓ Completed', color: '#087D0D', bg: '#F0FDF4' };
  let tc = { label: 'Pending', color: '#63666a', bg: '#F8FAFC' };
  let manager = { label: 'Pending', color: '#63666a', bg: '#F8FAFC' };
  let director = { label: 'Pending', color: '#63666a', bg: '#F8FAFC' };
  let vp = { label: 'Pending', color: '#63666a', bg: '#F8FAFC' };
  let business = { label: 'Not Required', color: '#63666a', bg: '#F8FAFC' };

  if (s.includes('staff') || s === 'draft') {
    staff = { label: '⏳ In Progress', color: '#000099', bg: '#EFF6FF' };
  } else if (s.includes('tc') || s.includes('coordinator')) {
    staff = { label: '✓ Completed', color: '#087D0D', bg: '#F0FDF4' };
    tc = { label: '⏳ In Progress', color: '#B45309', bg: '#FEF3C7' };
  } else if (s.includes('business') || s.includes('response')) {
    staff = { label: '✓ Completed', color: '#087D0D', bg: '#F0FDF4' };
    tc = { label: '✓ Completed', color: '#087D0D', bg: '#F0FDF4' };
    manager = { label: '⏳ Biz Response', color: '#0284C7', bg: '#F0F9FF' };
    business = { label: '⏳ In Progress', color: '#0284C7', bg: '#F0F9FF' };
  } else if (
    s.includes('waiting on other') ||
    s.includes('waiting for other') ||
    s.includes('waiting other') ||
    s.includes('manager completed') ||
    s.includes('ready for director')
  ) {
    staff = { label: '✓ Completed', color: '#087D0D', bg: '#F0FDF4' };
    tc = { label: '✓ Completed', color: '#087D0D', bg: '#F0FDF4' };
    manager = { label: '✓ Cleared (Wait)', color: '#087D0D', bg: '#ECFDF5' };
    director = { label: 'Pending Batch', color: '#63666a', bg: '#F1F5F9' };
  } else if (s.includes('manager')) {
    staff = { label: '✓ Completed', color: '#087D0D', bg: '#F0FDF4' };
    tc = { label: '✓ Completed', color: '#087D0D', bg: '#F0FDF4' };
    manager = { label: '⏳ In Progress', color: '#eb1700', bg: '#FFF1F0' };
  } else if (s.includes('director')) {
    staff = { label: '✓ Completed', color: '#087D0D', bg: '#F0FDF4' };
    tc = { label: '✓ Completed', color: '#087D0D', bg: '#F0FDF4' };
    manager = { label: '✓ Completed', color: '#087D0D', bg: '#F0FDF4' };
    director = { label: '⏳ In Progress', color: '#000099', bg: '#EFF6FF' };
  } else if (s.includes('vp')) {
    staff = { label: '✓ Completed', color: '#087D0D', bg: '#F0FDF4' };
    tc = { label: '✓ Completed', color: '#087D0D', bg: '#F0FDF4' };
    manager = { label: '✓ Completed', color: '#087D0D', bg: '#F0FDF4' };
    director = { label: '✓ Completed', color: '#087D0D', bg: '#F0FDF4' };
    vp = { label: '⏳ In Review', color: '#000099', bg: '#EFF6FF' };
  } else if (s === 'signed off' || s === 'completed') {
    staff = { label: '✓ Completed', color: '#087D0D', bg: '#F0FDF4' };
    tc = { label: '✓ Completed', color: '#087D0D', bg: '#F0FDF4' };
    manager = { label: '✓ Completed', color: '#087D0D', bg: '#F0FDF4' };
    director = { label: '✓ Completed', color: '#087D0D', bg: '#F0FDF4' };
    vp = { label: '✓ Signed Off', color: '#087D0D', bg: '#F0FDF4' };
  } else if (s === 'called back') {
    manager = { label: '↺ Called Back', color: '#eb1700', bg: '#FFF1F0' };
  } else if (s.includes('not my function')) {
    tc = { label: 'Out of Scope', color: '#087D0D', bg: '#ECFDF5' };
  }

  return { staff, tc, manager, director, vp, business, isExcluded };
};

// Efficient Mock Findings Dataset to showcase all workflow stages & both IT and FinOps domains
const DEMO_SHOWCASE_ISSUES = [
  {
    id: 'ISSUE-801',
    title: 'Privileged Account Monitoring & SOX 404 Access Revocation Delay',
    function: 'IT',
    criticality: 'Critical',
    status: 'Manager Completed (Waiting on other issues)',
    isExcluded: false,
  },
  {
    id: 'ISSUE-802',
    title: 'Refrigeration Sensor Telemetry & Calibration Drift Verification',
    function: 'IT',
    criticality: 'Major',
    status: 'Pending Manager',
    isExcluded: false,
  },
  {
    id: 'ISSUE-803',
    title: 'Third-Party Cloud Vendor Network Deprovisioning SLA Gap',
    function: 'IT',
    criticality: 'Minor',
    status: 'Pending Business',
    isExcluded: false,
  },
  {
    id: 'ISSUE-804',
    title: 'SAP Segregation of Duties & Manual Journal Entry Approval Matrix',
    function: 'FinOps',
    criticality: 'Major',
    status: 'Manager Completed (Waiting on other issues)',
    isExcluded: false,
  },
  {
    id: 'ISSUE-805',
    title: 'Quarterly Inventory Scrap & Cold-Chain Spoiled Lot Write-Off Reconciliation',
    function: 'FinOps',
    criticality: 'Minor',
    status: 'Pending TC',
    isExcluded: false,
  },
  {
    id: 'ISSUE-806',
    title: 'Duplicate Observation — Legacy Badge Access Log Archival',
    function: 'IT',
    criticality: 'Minor',
    status: 'Excluded',
    isExcluded: true,
  },
];

export const WorkflowModal: React.FC<WorkflowModalProps> = ({
  isOpen,
  title,
  report,
  job,
  issue,
  issues: _issuesProp,
  onClose,
  type = 'audit',
}) => {
  const [activeIssueTab, setActiveIssueTab] = useState<'graph' | 'details' | 'assignments'>('graph');

  useEffect(() => {
    if (isOpen) {
      setActiveIssueTab('graph');
    }
  }, [isOpen, issue?.id]);

  if (!isOpen) return null;

  const isIssueWorkflow = Boolean(issue);
  const currentJob = job || report || {};
  const jobId = currentJob.jobId || currentJob.id || currentJob.reportId || 'REP-2026-008';
  let auditTitle =
    currentJob.engagementName ||
    currentJob.fileName ||
    currentJob.fullName ||
    currentJob.engagement ||
    'IM - Grants Process Review';
  auditTitle = String(auditTitle).replace(/_?pipeline/gi, '').trim();

  // Detect whether this is an Audit Report workflow or Executive Summary workflow
  const isAuditWorkflow =
    isIssueWorkflow ||
    type === 'audit' ||
    Boolean(title && title.toLowerCase().includes('audit report')) ||
    currentJob.type === 'audit';

  const defaultTitle = isIssueWorkflow
    ? 'Issue Workflow'
    : isAuditWorkflow
      ? 'Audit Report Workflow Pipeline'
      : 'Executive Summary Workflow';

  let displayTitle = (title || defaultTitle).replace(/\s*pipeline\s*/gi, ' ').trim();
  if (!displayTitle || displayTitle.toLowerCase() === 'workflow stages') {
    displayTitle = defaultTitle;
  }

  // Scope to single issue when opened from Issue Actions, or full dataset for Report Options
  const realIssues: any[] = isIssueWorkflow
    ? [issue]
    : Array.isArray(_issuesProp) && _issuesProp.length > 0
      ? _issuesProp
      : DEMO_SHOWCASE_ISSUES;

  // Partition issues by domain
  const itIssues = realIssues.filter((i) => {
    const f = (i.function || i.functionType || i.tech || 'IT').toLowerCase();
    return f.includes('it') || f.includes('tech');
  });

  const finOpsIssues = realIssues.filter((i) => {
    const f = (i.function || i.functionType || i.tech || '').toLowerCase();
    return f.includes('finops') || f.includes('finance') || f.includes('fin');
  });

  // Resolve team members assigned to this engagement
  const workflowState = getEngagementWorkflowState(currentJob);
  const assignedUsers: any[] = Array.isArray(currentJob.assignedUsers)
    ? currentJob.assignedUsers
    : [];
  const findByRole = (rType: string) => {
    const found = assignedUsers.find((u: any) => {
      const { baseRole } = getRoleDetails(u.roleId || u.roleName);
      return baseRole === rType;
    });
    return found?.displayName || found?.name;
  };

  const tcUsers = getUsersByEngagementAndRole(jobId, 'it-team-coordinator').concat(
    getUsersByEngagementAndRole(jobId, 'finops-team-coordinator')
  );
  const mgrUsers = getUsersByEngagementAndRole(jobId, 'it-manager').concat(
    getUsersByEngagementAndRole(jobId, 'finops-manager')
  );
  const dirUsers = getUsersByEngagementAndRole(jobId, 'it-director').concat(
    getUsersByEngagementAndRole(jobId, 'finops-director')
  );
  const vpUsers = getUsersByEngagementAndRole(jobId, 'it-vp').concat(
    getUsersByEngagementAndRole(jobId, 'finops-vp')
  );

  const leadTC = findByRole('team-coordinator') || tcUsers[0]?.name || 'Gowri P';
  const leadMgr = findByRole('manager') || mgrUsers[0]?.name || 'Amanda Palmer';
  const leadDir = findByRole('director') || dirUsers[0]?.name || 'Marcus Vance';
  const leadVP = findByRole('vp') || vpUsers[0]?.name || 'Robert Chen';

  // Helper to compute domain metrics across all 6 stages
  const computeDomainMetrics = (issueArray: any[]) => {
    const activeIssueArray = issueArray.filter((iss) => !iss.isExcluded && iss.status !== 'Excluded');
    const total = activeIssueArray.length;
    if (total === 0) {
      return {
        total: 0,
        staffCompleted: 0,
        staffActive: 0,
        tcCompleted: 0,
        tcActive: 0,
        mgrCompleted: 0,
        mgrActive: 0,
        dirCompleted: 0,
        dirActive: 0,
        bizCompleted: 0,
        bizActive: 0,
        vpCompleted: 0,
        vpActive: 0,
        isAllCleared: false,
      };
    }
    let staffCompleted = 0;
    let staffActive = 0;
    let tcCompleted = 0;
    let tcActive = 0;
    let mgrCompleted = 0;
    let mgrActive = 0;
    let dirCompleted = 0;
    let dirActive = 0;
    let bizCompleted = 0;
    let bizActive = 0;
    let vpCompleted = 0;
    let vpActive = 0;

    activeIssueArray.forEach((iss) => {
      const stage = resolveIssueStageStatuses(iss);
      const hasBizResp = Boolean((iss.businessManagementResponse || iss.managementResponse || '').trim());

      if (stage.staff.label.includes('Completed')) staffCompleted++;
      if (stage.staff.label.includes('In Progress')) staffActive++;

      if (stage.tc.label.includes('Completed')) tcCompleted++;
      if (stage.tc.label.includes('In Progress')) tcActive++;

      if (stage.manager.label.includes('Completed') || stage.manager.label.includes('Cleared'))
        mgrCompleted++;
      if (stage.manager.label.includes('In Progress') || stage.manager.label.includes('Biz Response'))
        mgrActive++;

      if (stage.director.label.includes('Completed')) dirCompleted++;
      if (stage.director.label.includes('In Progress')) dirActive++;

      if (hasBizResp || stage.business.label.includes('Completed')) bizCompleted++;
      else if (stage.business.label.includes('In Progress')) bizActive++;

      if (stage.vp.label.includes('Signed Off') || stage.vp.label.includes('Completed')) vpCompleted++;
      if (stage.vp.label.includes('In Review')) vpActive++;
    });

    const isAllCleared = mgrCompleted === total && total > 0;

    return {
      total,
      staffCompleted,
      staffActive,
      tcCompleted,
      tcActive,
      mgrCompleted,
      mgrActive,
      dirCompleted,
      dirActive,
      bizCompleted,
      bizActive,
      vpCompleted,
      vpActive,
      isAllCleared,
    };
  };

  const itMetrics = computeDomainMetrics(itIssues);
  const finOpsMetrics = computeDomainMetrics(finOpsIssues);

  // Clean Pipeline Graph Renderer: Staff -> TC -> Manager -> Director (sub-route Director -> Business -> Manager) -> VP
  const renderPipelineDiagram = ({
    domainLabel,
    metrics,
    themeColor,
    themeBg,
    themeBorder,
    icon: DomainIcon,
  }: {
    domainLabel: string;
    metrics: ReturnType<typeof computeDomainMetrics>;
    themeColor: string;
    themeBg: string;
    themeBorder: string;
    icon: React.ComponentType<any>;
  }) => {
    const {
      total,
      staffCompleted,
      staffActive,
      tcCompleted,
      tcActive,
      mgrCompleted,
      mgrActive,
      dirCompleted,
      dirActive,
      bizCompleted,
      bizActive,
      vpCompleted,
      vpActive,
      isAllCleared,
    } = metrics;

    if (total === 0) {
      return (
        <div
          style={{
            backgroundColor: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '10px',
            padding: '18px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            color: '#64748B',
          }}
        >
          <DomainIcon style={{ width: '18px', height: '18px', color: themeColor }} />
          <div>
            <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
              {domainLabel} Workflow
            </div>
            <div style={{ fontSize: '12px', color: '#64748B' }}>
              No active findings mapped to this functional domain for this engagement.
            </div>
          </div>
        </div>
      );
    }

    const slug = domainLabel.replace(/[^a-zA-Z0-9]+/g, '-');
    const isStaffDone = staffCompleted === total;
    const isTcDone = tcCompleted === total;
    const isMgrDone = isAllCleared;
    const isDirDone = dirCompleted === total;
    const isVpDone = vpCompleted === total;
    const isBizDone = bizCompleted === total && total > 0;

    const topStages = [
      {
        step: 1,
        title: 'Staff',
        completed: staffCompleted,
        active: staffActive,
        isDone: isStaffDone,
        isActive: staffActive > 0,
      },
      {
        step: 2,
        title: 'TC',
        completed: tcCompleted,
        active: tcActive,
        isDone: isTcDone,
        isActive: tcActive > 0,
      },
      {
        step: 3,
        title: 'Manager',
        completed: mgrCompleted,
        active: mgrActive,
        isDone: isMgrDone,
        isActive: mgrActive > 0,
      },
      {
        step: 4,
        title: 'Director',
        completed: dirCompleted,
        active: dirActive,
        isDone: isDirDone,
        isActive: dirActive > 0,
      },
      {
        step: 5,
        title: 'VP',
        completed: vpCompleted,
        active: vpActive,
        isDone: isVpDone,
        isActive: vpActive > 0,
      },
    ];

    const renderNodeCard = (node: {
      step: number | string;
      title: string;
      completed: number;
      active: number;
      isDone: boolean;
      isActive: boolean;
      subtitle?: string;
    }) => {
      const borderColor = node.isDone
        ? '#16A34A'
        : node.isActive
          ? '#000099'
          : '#CBD5E1';
      const headerBg = node.isDone
        ? '#F0FDF4'
        : node.isActive
          ? '#EFF6FF'
          : '#F8FAFC';
      const statusText = node.isDone
        ? 'Completed'
        : node.isActive
          ? 'In Progress'
          : node.completed > 0
            ? 'In Progress'
            : 'Pending';
      const statusColor = node.isDone
        ? '#087D0D'
        : node.isActive || node.completed > 0
          ? '#000099'
          : '#64748B';

      return (
        <div
          style={{
            width: '154px',
            backgroundColor: '#FFFFFF',
            border: `1.5px solid ${borderColor}`,
            borderRadius: '8px',
            overflow: 'hidden',
            boxShadow: node.isActive
              ? '0 4px 12px rgba(0, 0, 153, 0.1)'
              : '0 1px 3px rgba(0, 0, 0, 0.04)',
          }}
        >
          <div
            style={{
              padding: '8px 10px',
              backgroundColor: headerBg,
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '6px',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
              <span
                style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  backgroundColor: node.isDone
                    ? '#16A34A'
                    : node.isActive
                      ? '#000099'
                      : '#94A3B8',
                  color: '#FFFFFF',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '10.5px',
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {node.isDone ? (
                  <CheckCircle2 style={{ width: '12px', height: '12px' }} />
                ) : node.isActive ? (
                  <Clock style={{ width: '12px', height: '12px' }} />
                ) : (
                  node.step
                )}
              </span>
              <span
                style={{
                  fontSize: '12px',
                  fontWeight: 700,
                  color: '#0F172A',
                  whiteSpace: 'nowrap',
                }}
              >
                {node.title}
              </span>
            </div>

            <span
              style={{
                fontSize: '10.5px',
                fontWeight: 700,
                color: statusColor,
                backgroundColor: '#FFFFFF',
                border: `1px solid ${borderColor}`,
                padding: '1px 6px',
                borderRadius: '999px',
                flexShrink: 0,
              }}
            >
              {node.completed}/{total}
            </span>
          </div>

          <div
            style={{
              padding: '7px 10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '11px',
            }}
          >
            <span style={{ color: '#64748B', fontWeight: 500 }}>
              {node.subtitle || statusText}
            </span>
            <span style={{ fontWeight: 600, color: statusColor }}>
              {node.active > 0 ? `${node.active} Active` : `${node.completed} Done`}
            </span>
          </div>
        </div>
      );
    };

    return (
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '10px',
          padding: '18px 20px',
          display: 'flex',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        {/* Domain Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #F1F5F9',
            paddingBottom: '10px',
          }}
        >
          <div
            style={{
              fontSize: '13px',
              fontWeight: 700,
              color: '#0F172A',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <DomainIcon style={{ width: '16px', height: '16px', color: themeColor }} />
            <span>{domainLabel}</span>
          </div>
          <span
            style={{
              fontSize: '11px',
              fontWeight: 700,
              color: themeColor,
              backgroundColor: themeBg,
              padding: '2px 10px',
              borderRadius: '999px',
              border: `1px solid ${themeBorder}`,
            }}
          >
            Total Active Findings: {total}
          </span>
        </div>

        {/* Graphical Flow Canvas: Top Row (Staff -> TC -> Manager -> Director -> VP) + Sub-route (Director -> Business -> Manager) */}
        <div style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>
          {/* Top Linear Row: Staff -> TC -> Manager -> Director -> VP */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              position: 'relative',
              zIndex: 2,
            }}
          >
            {topStages.map((stg, i) => (
              <React.Fragment key={stg.title}>
                {renderNodeCard(stg)}
                {i < topStages.length - 1 && (
                  <div
                    style={{
                      flex: 1,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: stg.isDone ? '#16A34A' : '#CBD5E1',
                      minWidth: '18px',
                    }}
                  >
                    <div
                      style={{
                        height: '2px',
                        flex: 1,
                        backgroundColor: stg.isDone ? '#16A34A' : '#CBD5E1',
                      }}
                    />
                    <ArrowRight
                      style={{
                        width: '14px',
                        height: '14px',
                        marginLeft: '-4px',
                        flexShrink: 0,
                      }}
                    />
                  </div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Sub-Route Loop Row: Director -> Business -> Manager */}
          <div
            style={{
              position: 'relative',
              height: '118px',
              marginTop: '4px',
            }}
          >
            <svg
              viewBox="0 0 860 118"
              preserveAspectRatio="none"
              style={{
                position: 'absolute',
                inset: 0,
                width: '100%',
                height: '100%',
                pointerEvents: 'none',
              }}
            >
              <defs>
                <marker
                  id={`arrow-dir-biz-${slug}`}
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <path
                    d="M 0 0 L 10 5 L 0 10 z"
                    fill={bizActive > 0 || isBizDone ? '#000099' : '#94A3B8'}
                  />
                </marker>
                <marker
                  id={`arrow-biz-mgr-${slug}`}
                  viewBox="0 0 10 10"
                  refX="6"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <path
                    d="M 0 0 L 10 5 L 0 10 z"
                    fill={isBizDone ? '#16A34A' : '#94A3B8'}
                  />
                </marker>
              </defs>

              {/* Director (x=630) down and left into Business right side (x=590, y=64) */}
              <path
                d="M 630 2 L 630 64 L 592 64"
                fill="none"
                stroke={bizActive > 0 || isBizDone ? '#000099' : '#CBD5E1'}
                strokeWidth="2"
                strokeDasharray={bizActive > 0 || isBizDone ? 'none' : '4,4'}
                markerEnd={`url(#arrow-dir-biz-${slug})`}
              />

              {/* Business left side (x=420, y=64) left and up into Manager bottom (x=430, y=6) */}
              <path
                d="M 418 64 L 380 64 L 380 6"
                fill="none"
                stroke={isBizDone ? '#16A34A' : '#CBD5E1'}
                strokeWidth="2"
                strokeDasharray={isBizDone ? 'none' : '4,4'}
                markerEnd={`url(#arrow-biz-mgr-${slug})`}
              />
            </svg>

            {/* Sub-Route Node: Business (Positioned centered between Manager and Director) */}
            <div
              style={{
                position: 'absolute',
                left: '58.5%',
                top: '26px',
                transform: 'translateX(-50%)',
                zIndex: 2,
              }}
            >
              {renderNodeCard({
                step: 'B',
                title: 'Business',
                completed: bizCompleted,
                active: bizActive,
                isDone: isBizDone,
                isActive: bizActive > 0,
                subtitle: 'Sub-Route',
              })}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (isIssueWorkflow && issue) {
    const stages = resolveIssueStageStatuses(issue);
    const domainTag = issue.function || issue.functionType || issue.tech || 'IT';
    const isITDomain = !String(domainTag).toLowerCase().includes('fin');
    const funcLabel = isITDomain ? 'IT' : 'FinOps';

    // Resolve engagement assignees with Persona, Function, Name, and Email
    const staffPool = getUsersByEngagementAndRole(jobId, 'it-auditor').concat(
      getUsersByEngagementAndRole(jobId, 'finops-auditor')
    );
    const rawAssignments: Array<{
      persona: string;
      functionName: string;
      name: string;
      email: string;
    }> = [];

    if (Array.isArray(assignedUsers) && assignedUsers.length > 0) {
      assignedUsers.forEach((u: any) => {
        const { domain, baseRole } = getRoleDetails(u.roleId || u.roleName);
        const isFinOps = String(domain || '').toLowerCase().includes('fin');
        const personaMap: Record<string, string> = {
          auditor: 'Staff Auditor',
          'team-coordinator': 'Team Coordinator',
          manager: 'Audit Manager',
          director: 'Audit Director',
          vp: 'Vice President',
          'primary-business-contact': 'Primary Business Contact',
        };
        const uName = u.displayName || u.name || 'Assigned Auditor';
        const uEmail =
          u.email ||
          `${uName.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@its.jnj.com`;
        rawAssignments.push({
          persona: personaMap[baseRole] || u.roleName || 'Audit Team Member',
          functionName: isFinOps ? 'FinOps' : 'IT',
          name: uName,
          email: uEmail,
        });
      });
    } else {
      const leadStaff = staffPool[0]?.name || issue.createdBy || 'Alex Rivera';
      rawAssignments.push(
        {
          persona: 'Staff Auditor',
          functionName: funcLabel,
          name: leadStaff,
          email: `${leadStaff.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@its.jnj.com`,
        },
        {
          persona: 'Team Coordinator',
          functionName: funcLabel,
          name: leadTC,
          email: `${leadTC.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@its.jnj.com`,
        },
        {
          persona: 'Audit Manager',
          functionName: funcLabel,
          name: leadMgr,
          email: `${leadMgr.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@its.jnj.com`,
        },
        {
          persona: 'Audit Director',
          functionName: funcLabel,
          name: leadDir,
          email: `${leadDir.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@its.jnj.com`,
        },
        {
          persona: 'Vice President',
          functionName: funcLabel,
          name: leadVP,
          email: `${leadVP.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@its.jnj.com`,
        }
      );
    }

    const bizOwnerName =
      issue.primaryBusinessOwnerName ||
      issue.primaryContact ||
      issue.businessContactName ||
      issue.accountableContact;
    if (bizOwnerName) {
      rawAssignments.push({
        persona: 'Primary Business Owner',
        functionName: funcLabel,
        name: bizOwnerName,
        email: `${bizOwnerName.toLowerCase().replace(/[^a-z0-9]+/g, '.')}@its.jnj.com`,
      });
    }

    const staffName =
      rawAssignments.find((a) => a.persona.toLowerCase().includes('staff'))?.name ||
      issue.createdBy ||
      'Alex Rivera';
    const tcName =
      rawAssignments.find((a) => a.persona.toLowerCase().includes('coordinator'))?.name ||
      leadTC;
    const mgrName =
      rawAssignments.find((a) => a.persona.toLowerCase().includes('manager'))?.name ||
      leadMgr;
    const dirName =
      rawAssignments.find((a) => a.persona.toLowerCase().includes('director'))?.name ||
      leadDir;
    const vpName =
      rawAssignments.find((a) => a.persona.toLowerCase().includes('vice president'))?.name ||
      leadVP;
    const bizName =
      issue.businessResponseAddedOnBehalfBy ||
      issue.businessResponseProvidedBy ||
      bizOwnerName ||
      'Business Owner';

    const hasBizResponse = Boolean(
      (issue.businessManagementResponse || issue.managementResponse || '').trim()
    );

    const isStageDone = (label: string) =>
      label.includes('Completed') || label.includes('Cleared') || label.includes('Signed Off');

    const issueStageRows = [
      {
        step: 1,
        stage: 'Staff Drafting',
        status: stages.staff.label.replace(/^[✓⏳↺]\s*/, ''),
        rawLabel: stages.staff.label,
        color: stages.staff.color,
        bg: stages.staff.bg,
        isDone: isStageDone(stages.staff.label),
        isActive: stages.staff.label.includes('In Progress'),
        completedBy: isStageDone(stages.staff.label) ? staffName : '—',
        completedAt: isStageDone(stages.staff.label)
          ? issue.createdAt || 'Oct 24, 2026, 09:30 AM'
          : '—',
      },
      {
        step: 2,
        stage: 'TC Review',
        status: stages.tc.label.replace(/^[✓⏳↺]\s*/, ''),
        rawLabel: stages.tc.label,
        color: stages.tc.color,
        bg: stages.tc.bg,
        isDone: isStageDone(stages.tc.label),
        isActive: stages.tc.label.includes('In Progress'),
        completedBy: isStageDone(stages.tc.label) ? tcName : '—',
        completedAt: isStageDone(stages.tc.label) ? 'Oct 25, 2026, 02:15 PM' : '—',
      },
      {
        step: 3,
        stage: 'Manager Review',
        status: stages.manager.label.replace(/^[✓⏳↺]\s*/, ''),
        rawLabel: stages.manager.label,
        color: stages.manager.color,
        bg: stages.manager.bg,
        isDone: isStageDone(stages.manager.label),
        isActive:
          stages.manager.label.includes('In Progress') ||
          stages.manager.label.includes('Biz Response'),
        completedBy: isStageDone(stages.manager.label) ? mgrName : '—',
        completedAt: isStageDone(stages.manager.label) ? 'Oct 26, 2026, 04:45 PM' : '—',
      },
      {
        step: 4,
        stage: 'Director Review',
        status: stages.director.label.replace(/^[✓⏳↺]\s*/, ''),
        rawLabel: stages.director.label,
        color: stages.director.color,
        bg: stages.director.bg,
        isDone: isStageDone(stages.director.label),
        isActive: stages.director.label.includes('In Progress'),
        completedBy: isStageDone(stages.director.label) ? dirName : '—',
        completedAt: isStageDone(stages.director.label) ? 'Oct 27, 2026, 11:20 AM' : '—',
      },
      {
        step: 5,
        stage: 'Business Response',
        status: hasBizResponse
          ? 'Completed'
          : stages.business.label.replace(/^[✓⏳↺]\s*/, ''),
        rawLabel: hasBizResponse ? '✓ Completed' : stages.business.label,
        color: hasBizResponse ? '#087D0D' : stages.business.color,
        bg: hasBizResponse ? '#F0FDF4' : stages.business.bg,
        isDone: hasBizResponse || isStageDone(stages.business.label),
        isActive: !hasBizResponse && stages.business.label.includes('In Progress'),
        completedBy: hasBizResponse ? bizName : '—',
        completedAt: hasBizResponse
          ? issue.businessResponseAddedOnBehalfAt ||
            issue.businessResponseProvidedAt ||
            issue.updatedAt ||
            'Oct 28, 2026, 02:30 PM'
          : '—',
      },
      {
        step: 6,
        stage: 'VP Sign-Off',
        status: stages.vp.label.replace(/^[✓⏳↺]\s*/, ''),
        rawLabel: stages.vp.label,
        color: stages.vp.color,
        bg: stages.vp.bg,
        isDone: isStageDone(stages.vp.label),
        isActive: stages.vp.label.includes('In Review'),
        completedBy: isStageDone(stages.vp.label) ? vpName : '—',
        completedAt: isStageDone(stages.vp.label)
          ? issue.updatedAt || 'Oct 29, 2026, 01:00 PM'
          : '—',
      },
    ];

    return (
      <div
        role="dialog"
        aria-modal="true"
        style={{
          position: 'fixed',
          inset: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.5)',
          backdropFilter: 'blur(2px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px',
          zIndex: 1500,
          fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
        }}
        onClick={onClose}
      >
        <div
          onClick={(e) => e.stopPropagation()}
          style={{
            width: '920px',
            maxWidth: '96vw',
            maxHeight: '86vh',
            backgroundColor: '#FFFFFF',
            borderRadius: '10px',
            boxShadow: '0 24px 48px rgba(0, 0, 0, 0.2)',
            border: '1px solid #E2E8F0',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Dialog Header */}
          <div
            style={{
              padding: '18px 24px 14px 24px',
              display: 'flex',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
              gap: '16px',
              backgroundColor: '#FFFFFF',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
              <div
                style={{
                  width: '36px',
                  height: '36px',
                  borderRadius: '8px',
                  backgroundColor: '#EFF6FF',
                  border: '1px solid #BFDBFE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#000099',
                  flexShrink: 0,
                }}
              >
                <GitBranch style={{ width: '18px', height: '18px' }} />
              </div>
              <div style={{ minWidth: 0 }}>
                <h3
                  className="type-modal-title"
                  style={{
                    margin: 0,
                    fontSize: 'var(--type-modal-title-size, 15px)',
                    fontWeight: 700,
                    color: '#0F172A',
                    lineHeight: 1.35,
                  }}
                >
                  {issue.title || issue.header || issue.id || 'Audit Finding'}
                </h3>
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                    marginTop: '4px',
                    fontSize: '12px',
                    color: '#64748B',
                  }}
                >
                  <span>Current Status:</span>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#000099',
                      backgroundColor: '#EFF6FF',
                      border: '1px solid #BFDBFE',
                      padding: '1px 8px',
                      borderRadius: '4px',
                    }}
                  >
                    {issue.status || 'Pending Staff'}
                  </span>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '6px',
                borderRadius: '6px',
                border: '1px solid #E2E8F0',
                backgroundColor: '#FFFFFF',
                color: '#64748B',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
              title="Close Dialog"
            >
              <X style={{ width: '16px', height: '16px' }} />
            </button>
          </div>

          {/* 3-Tab Navigation Bar */}
          <div style={{ padding: '0 24px', backgroundColor: '#FFFFFF' }}>
            <SharedTabs
              items={[
                { id: 'graph', label: 'Workflow Graph' },
                { id: 'details', label: 'Workflow Details' },
                { id: 'assignments', label: 'Assignments', count: rawAssignments.length },
              ]}
              value={activeIssueTab}
              onChange={(val) => setActiveIssueTab(val)}
              variant="primary"
              size="small"
              marginBottom="0px"
            />
          </div>

          {/* Tab Body */}
          <div
            style={{
              padding: '20px 24px 24px 24px',
              overflowY: 'auto',
              backgroundColor: '#F8FAFC',
              flex: 1,
            }}
          >
            {/* TAB 1: WORKFLOW GRAPH (Graphical Stage Progression with Stage, Status, Who Completed, When Completed) */}
            {activeIssueTab === 'graph' && (
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '10px',
                  padding: '20px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '16px',
                }}
              >
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: '16px',
                  }}
                >
                  {issueStageRows.map((row, idx) => {
                    const borderColor = row.isDone
                      ? '#16A34A'
                      : row.isActive
                        ? '#000099'
                        : '#CBD5E1';
                    const headerBg = row.isDone
                      ? '#F0FDF4'
                      : row.isActive
                        ? '#EFF6FF'
                        : '#F8FAFC';

                    return (
                      <div
                        key={row.step}
                        style={{
                          position: 'relative',
                          display: 'flex',
                          alignItems: 'stretch',
                        }}
                      >
                        <div
                          style={{
                            flex: 1,
                            backgroundColor: '#FFFFFF',
                            border: `1.5px solid ${borderColor}`,
                            borderRadius: '8px',
                            overflow: 'hidden',
                            boxShadow: row.isActive
                              ? '0 4px 12px rgba(0, 0, 153, 0.1)'
                              : '0 1px 3px rgba(0, 0, 0, 0.04)',
                            display: 'flex',
                            flexDirection: 'column',
                          }}
                        >
                          {/* Stage Card Header: Stage & Status */}
                          <div
                            style={{
                              padding: '10px 12px',
                              backgroundColor: headerBg,
                              borderBottom: '1px solid #E2E8F0',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              gap: '8px',
                            }}
                          >
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                              <span
                                style={{
                                  width: '22px',
                                  height: '22px',
                                  borderRadius: '50%',
                                  backgroundColor: row.isDone
                                    ? '#16A34A'
                                    : row.isActive
                                      ? '#000099'
                                      : '#94A3B8',
                                  color: '#FFFFFF',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  flexShrink: 0,
                                }}
                              >
                                {row.isDone ? (
                                  <CheckCircle2 style={{ width: '13px', height: '13px' }} />
                                ) : row.isActive ? (
                                  <Clock style={{ width: '13px', height: '13px' }} />
                                ) : (
                                  row.step
                                )}
                              </span>
                              <span
                                style={{
                                  fontSize: '12.5px',
                                  fontWeight: 700,
                                  color: '#0F172A',
                                  whiteSpace: 'nowrap',
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                }}
                              >
                                {row.stage}
                              </span>
                            </div>

                            <span
                              style={{
                                fontSize: '10.5px',
                                fontWeight: 700,
                                color: row.color,
                                backgroundColor: '#FFFFFF',
                                border: `1px solid ${borderColor}`,
                                padding: '2px 7px',
                                borderRadius: '999px',
                                whiteSpace: 'nowrap',
                                flexShrink: 0,
                              }}
                            >
                              {row.status}
                            </span>
                          </div>

                          {/* Stage Card Body: Who Completed & When Completed */}
                          <div
                            style={{
                              padding: '10px 12px',
                              display: 'flex',
                              flexDirection: 'column',
                              gap: '6px',
                              fontSize: '11.5px',
                            }}
                          >
                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '8px',
                              }}
                            >
                              <span
                                style={{
                                  color: '#64748B',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                }}
                              >
                                <UserCheck style={{ width: '12px', height: '12px', color: '#94A3B8' }} />
                                Who Completed
                              </span>
                              <span
                                style={{
                                  fontWeight: 600,
                                  color: row.completedBy !== '—' ? '#1E293B' : '#94A3B8',
                                }}
                              >
                                {row.completedBy}
                              </span>
                            </div>

                            <div
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: '8px',
                              }}
                            >
                              <span
                                style={{
                                  color: '#64748B',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '5px',
                                }}
                              >
                                <Calendar style={{ width: '12px', height: '12px', color: '#94A3B8' }} />
                                When Completed
                              </span>
                              <span
                                style={{
                                  fontWeight: 500,
                                  color: row.completedAt !== '—' ? '#334155' : '#94A3B8',
                                }}
                              >
                                {row.completedAt}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Connector Arrow to next stage in row */}
                        {idx % 3 !== 2 && idx < issueStageRows.length - 1 && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              width: '16px',
                              marginRight: '-16px',
                              zIndex: 2,
                              color: row.isDone ? '#16A34A' : '#CBD5E1',
                            }}
                          >
                            <ArrowRight style={{ width: '14px', height: '14px' }} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 2: WORKFLOW DETAILS (Clean Table: Stage, Status, Who Completed, When Completed) */}
            {activeIssueTab === 'details' && (
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '12.5px',
                    textAlign: 'left',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        backgroundColor: '#F8FAFC',
                        borderBottom: '1px solid #E2E8F0',
                        color: '#334155',
                      }}
                    >
                      <th style={{ padding: '10px 16px', fontWeight: 700 }}>Stage</th>
                      <th style={{ padding: '10px 16px', fontWeight: 700 }}>Status</th>
                      <th style={{ padding: '10px 16px', fontWeight: 700 }}>Who Completed</th>
                      <th style={{ padding: '10px 16px', fontWeight: 700 }}>When Completed</th>
                    </tr>
                  </thead>
                  <tbody>
                    {issueStageRows.map((row, index) => (
                      <tr
                        key={row.step}
                        style={{
                          borderBottom:
                            index < issueStageRows.length - 1 ? '1px solid #F1F5F9' : 'none',
                          backgroundColor: '#FFFFFF',
                        }}
                      >
                        <td style={{ padding: '11px 16px', fontWeight: 600, color: '#0F172A' }}>
                          {row.step}. {row.stage}
                        </td>
                        <td style={{ padding: '11px 16px' }}>
                          <span
                            style={{
                              fontSize: '11px',
                              fontWeight: 700,
                              color: row.color,
                              backgroundColor: row.bg,
                              padding: '3px 8px',
                              borderRadius: '4px',
                              display: 'inline-block',
                            }}
                          >
                            {row.status}
                          </span>
                        </td>
                        <td
                          style={{
                            padding: '11px 16px',
                            fontWeight: row.completedBy !== '—' ? 600 : 400,
                            color: row.completedBy !== '—' ? '#1E293B' : '#94A3B8',
                          }}
                        >
                          {row.completedBy}
                        </td>
                        <td
                          style={{
                            padding: '11px 16px',
                            color: row.completedAt !== '—' ? '#475569' : '#94A3B8',
                          }}
                        >
                          {row.completedAt}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB 3: ASSIGNMENTS (Clean Table: Persona, Function, Name Assigned with Email) */}
            {activeIssueTab === 'assignments' && (
              <div
                style={{
                  backgroundColor: '#FFFFFF',
                  border: '1px solid #E2E8F0',
                  borderRadius: '8px',
                  overflow: 'hidden',
                }}
              >
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: '12.5px',
                    textAlign: 'left',
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        backgroundColor: '#F8FAFC',
                        borderBottom: '1px solid #E2E8F0',
                        color: '#334155',
                      }}
                    >
                      <th style={{ padding: '10px 16px', fontWeight: 700 }}>Persona</th>
                      <th style={{ padding: '10px 16px', fontWeight: 700 }}>Function</th>
                      <th style={{ padding: '10px 16px', fontWeight: 700 }}>Assigned User</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rawAssignments.map((item, idx) => {
                      const isITRow = item.functionName.toLowerCase() === 'it';
                      return (
                        <tr
                          key={`${item.persona}-${item.name}-${idx}`}
                          style={{
                            borderBottom:
                              idx < rawAssignments.length - 1 ? '1px solid #F1F5F9' : 'none',
                            backgroundColor: '#FFFFFF',
                          }}
                        >
                          <td style={{ padding: '11px 16px', fontWeight: 600, color: '#0F172A' }}>
                            {item.persona}
                          </td>
                          <td style={{ padding: '11px 16px' }}>
                            <span
                              style={{
                                fontSize: '11px',
                                fontWeight: 700,
                                padding: '2px 8px',
                                borderRadius: '4px',
                                backgroundColor: isITRow ? '#EFF6FF' : '#F0FDF4',
                                color: isITRow ? '#000099' : '#087D0D',
                              }}
                            >
                              {item.functionName}
                            </span>
                          </td>
                          <td style={{ padding: '11px 16px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1px' }}>
                              <span style={{ fontWeight: 600, color: '#1E293B' }}>{item.name}</span>
                              <span style={{ fontSize: '11.5px', color: '#64748B' }}>
                                {item.email}
                              </span>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.5)',
        backdropFilter: 'blur(2px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 1500,
        fontFamily: 'var(--type-font-family, "jj-circular", Arial, Helvetica, sans-serif)',
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '960px',
          maxWidth: '96vw',
          maxHeight: '88vh',
          backgroundColor: '#FFFFFF',
          borderRadius: '10px',
          boxShadow: '0 24px 48px rgba(0, 0, 0, 0.2)',
          border: '1px solid #E2E8F0',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* Dialog Header */}
        <div
          style={{
            padding: '18px 24px 14px 24px',
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: '16px',
            backgroundColor: '#FFFFFF',
            borderBottom: '1px solid #E2E8F0',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', minWidth: 0 }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                backgroundColor: '#EFF6FF',
                border: '1px solid #BFDBFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#000099',
                flexShrink: 0,
              }}
            >
              <GitBranch style={{ width: '18px', height: '18px' }} />
            </div>
            <div style={{ minWidth: 0 }}>
              <h3
                className="type-modal-title"
                style={{
                  margin: 0,
                  fontSize: 'var(--type-modal-title-size, 15px)',
                  fontWeight: 700,
                  color: '#0F172A',
                  lineHeight: 1.35,
                }}
              >
                {displayTitle}
              </h3>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginTop: '4px',
                  fontSize: '12px',
                  color: '#64748B',
                }}
              >
                <span>
                  {auditTitle} ({realIssues.length} Findings)
                </span>
                <span>•</span>
                <span>Current Queue:</span>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#000099',
                    backgroundColor: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    padding: '1px 8px',
                    borderRadius: '4px',
                  }}
                >
                  {workflowState.queue}
                </span>
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              padding: '6px',
              borderRadius: '6px',
              border: '1px solid #E2E8F0',
              backgroundColor: '#FFFFFF',
              color: '#64748B',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              flexShrink: 0,
            }}
            title="Close Dialog"
          >
            <X style={{ width: '16px', height: '16px' }} />
          </button>
        </div>

        {/* Scrollable Workflow Graphs (No multiple tabs, only graph flow, no matrix, no governance parties section) */}
        <div
          style={{
            padding: '20px 24px 24px 24px',
            overflowY: 'auto',
            backgroundColor: '#F8FAFC',
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            gap: '18px',
          }}
        >
          {isAuditWorkflow ? (
            <>
              {/* IT Issues Pipeline */}
              {renderPipelineDiagram({
                domainLabel: 'IT',
                metrics: itMetrics,
                themeColor: '#000099',
                themeBg: '#EFF6FF',
                themeBorder: '#BFDBFE',
                icon: Cpu,
              })}

              {/* FinOps Issues Pipeline */}
              {renderPipelineDiagram({
                domainLabel: 'FinOps',
                metrics: finOpsMetrics,
                themeColor: '#087D0D',
                themeBg: '#F0FDF4',
                themeBorder: '#A7F3D0',
                icon: TrendingUp,
              })}
            </>
          ) : (
            /* EXECUTIVE SUMMARY WORKFLOW (4 DYNAMIC PIPELINE STAGES) */
            <div
              style={{
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                borderRadius: '10px',
                padding: '20px',
                display: 'flex',
                flexDirection: 'column',
                gap: '16px',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid #F1F5F9',
                  paddingBottom: '10px',
                }}
              >
                <div
                  style={{
                    fontSize: '13px',
                    fontWeight: 700,
                    color: '#0F172A',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <ShieldCheck style={{ width: '16px', height: '16px', color: '#000099' }} />
                  <span>Executive Summary Clearance Pipeline</span>
                </div>
                <span
                  style={{
                    fontSize: '11px',
                    fontWeight: 700,
                    color: '#000099',
                    backgroundColor: '#EFF6FF',
                    padding: '2px 10px',
                    borderRadius: '999px',
                    border: '1px solid #BFDBFE',
                  }}
                >
                  Current Queue: {workflowState.queue}
                </span>
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  position: 'relative',
                }}
              >
                {[
                  {
                    step: 1,
                    title: 'AI Draft',
                    isDone: true,
                    isActive: false,
                    statusText: 'Synthesized',
                  },
                  {
                    step: 2,
                    title: 'Manager Review',
                    isDone:
                      workflowState.queue === 'Director' ||
                      workflowState.queue === 'Vice President' ||
                      workflowState.status === 'Completed',
                    isActive:
                      workflowState.queue === 'Staff' || workflowState.queue.includes('Manager'),
                    statusText:
                      workflowState.queue === 'Staff' || workflowState.queue.includes('Manager')
                        ? 'Active Now'
                        : 'Completed',
                  },
                  {
                    step: 3,
                    title: 'Director Review',
                    isDone:
                      workflowState.queue === 'Vice President' ||
                      workflowState.status === 'Completed',
                    isActive: workflowState.queue === 'Director',
                    statusText:
                      workflowState.queue === 'Director'
                        ? 'Active Now'
                        : workflowState.queue === 'Vice President' ||
                            workflowState.status === 'Completed'
                          ? 'Completed'
                          : 'Pending',
                  },
                  {
                    step: 4,
                    title: 'VP Sign-Off',
                    isDone: workflowState.status === 'Completed',
                    isActive: workflowState.queue === 'Vice President',
                    statusText:
                      workflowState.status === 'Completed'
                        ? 'Signed Off'
                        : workflowState.queue === 'Vice President'
                          ? 'Active Now'
                          : 'Not Started',
                  },
                ].map((stg, i, arr) => {
                  const borderColor = stg.isDone
                    ? '#16A34A'
                    : stg.isActive
                      ? '#000099'
                      : '#CBD5E1';
                  const headerBg = stg.isDone
                    ? '#F0FDF4'
                    : stg.isActive
                      ? '#EFF6FF'
                      : '#F8FAFC';

                  return (
                    <React.Fragment key={stg.title}>
                      <div
                        style={{
                          width: '180px',
                          backgroundColor: '#FFFFFF',
                          border: `1.5px solid ${borderColor}`,
                          borderRadius: '8px',
                          overflow: 'hidden',
                          boxShadow: stg.isActive
                            ? '0 4px 12px rgba(0, 0, 153, 0.1)'
                            : '0 1px 3px rgba(0, 0, 0, 0.04)',
                        }}
                      >
                        <div
                          style={{
                            padding: '10px 12px',
                            backgroundColor: headerBg,
                            borderBottom: '1px solid #E2E8F0',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              style={{
                                width: '22px',
                                height: '22px',
                                borderRadius: '50%',
                                backgroundColor: stg.isDone
                                  ? '#16A34A'
                                  : stg.isActive
                                    ? '#000099'
                                    : '#94A3B8',
                                color: '#FFFFFF',
                                display: 'inline-flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: '11px',
                                fontWeight: 700,
                              }}
                            >
                              {stg.isDone ? (
                                <CheckCircle2 style={{ width: '13px', height: '13px' }} />
                              ) : stg.isActive ? (
                                <Clock style={{ width: '13px', height: '13px' }} />
                              ) : (
                                stg.step
                              )}
                            </span>
                            <span style={{ fontSize: '12.5px', fontWeight: 700, color: '#0F172A' }}>
                              {stg.title}
                            </span>
                          </div>
                        </div>

                        <div
                          style={{
                            padding: '8px 12px',
                            fontSize: '11.5px',
                            fontWeight: 600,
                            color: stg.isDone ? '#087D0D' : stg.isActive ? '#000099' : '#64748B',
                          }}
                        >
                          {stg.statusText}
                        </div>
                      </div>

                      {i < arr.length - 1 && (
                        <div
                          style={{
                            flex: 1,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: stg.isDone ? '#16A34A' : '#CBD5E1',
                            minWidth: '20px',
                          }}
                        >
                          <div
                            style={{
                              height: '2px',
                              flex: 1,
                              backgroundColor: stg.isDone ? '#16A34A' : '#CBD5E1',
                            }}
                          />
                          <ArrowRight
                            style={{
                              width: '14px',
                              height: '14px',
                              marginLeft: '-4px',
                              flexShrink: 0,
                            }}
                          />
                        </div>
                      )}
                    </React.Fragment>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
